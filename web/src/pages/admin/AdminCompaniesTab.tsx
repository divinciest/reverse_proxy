import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Briefcase, Building2 } from 'lucide-react';
import { CompanySource } from '@/types/admin';
import TabContent from '@/components/admin/TabContent';
import AddCompanyForm from '@/components/admin/companies/AddCompanyForm';
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { CompanyCard } from '@/components/admin/cards';
import CompanyListView from '@/components/admin/companies/CompanyListView';
import { getBestFaviconUrl } from '@/utils/favicon';
import { companyService, adminCompanyService } from '@/utils/services/companyService';
import { SearchInput } from '@/components/common/SearchInput';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function AdminCompaniesTab() {
  console.log('AdminCompaniesTab component rendered');
  
  // Company sources state
  const [companySources, setCompanySources] = useState<CompanySource[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyLogo, setNewCompanyLogo] = useState('');
  const [newCompanyCount, setNewCompanyCount] = useState(0);
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  const [newCompanyIsFirm, setNewCompanyIsFirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state for views, search, and sort
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [companySearch, setCompanySearch] = useState('');
  const [debouncedCompanySearch, setDebouncedCompanySearch] = useState(companySearch);
  const [companySort, setCompanySort] = useState<'default' | 'az' | 'za'>('default');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  // Define a type for your Company items if you don't have one already
  // For example:
  // type Company = { _id: string; name: string; /* ...other company properties */ };

  // --- Define Sort Options for Companies ---
  const companySortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'az', label: 'Name (A-Z)' },
    { value: 'za', label: 'Name (Z-A)' },
    // Add other relevant sort options for companies, e.g.:
    // { value: "user_count_desc", label: "Users (Most)" },
    // { value: "user_count_asc", label: "Users (Fewest)" },
    // { value: "creation_date_desc", label: "Newest" },
  ];
  // --- End Sort Options for Companies ---



  // Load companies from API
  const fetchCompanies = async () => {
    console.log('fetchCompanies called');
    setLoading(true);
    setError(null);
    try {
      console.log('Making API call to getPlatformCompanies...');
      const data = await companyService.getPlatformCompaniesForAdmin();
      console.log('Raw companies data from API:', data);

      if (data && data.length > 0) {
        const formattedCompanies: CompanySource[] = data.map((company) => ({
          id: company._id,
          name: company.name,
          logo: company.favicon || getBestFaviconUrl(company.name, company.domain || ''),
          count: 0, // Default value
          selected: false,
          url: company.domain || '',
          enabled: company.enabled,
          is_firm: company.is_firm || false,
        }));

        console.log('Formatted companies:', formattedCompanies);

        setCompanySources([
          {
            id: 'all', name: 'All', logo: '', count: formattedCompanies.length, selected: true, url: '', enabled: true, is_firm: false,
          },
          ...formattedCompanies,
        ]);
      } else {
        console.warn('Empty or invalid companies data returned from API');
        setCompanySources([
          {
            id: 'all', name: 'All', logo: '', count: 0, selected: true, url: '', enabled: true, is_firm: false,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to load companies. Please check your connection and try again.');
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect for fetchCompanies triggered');
    fetchCompanies();
  }, []);

  // Auto-generate logos on component mount for companies that don't have one
  useEffect(() => {
    // Only run if we have companies loaded (more than just the "All" entry)
    if (companySources.length > 1) {
      const companiesNeedingLogos = companySources.filter(company => 
        !company.logo && company.id !== 'all' && company.url
      );
      
      if (companiesNeedingLogos.length > 0) {
        const updatedCompanies = companySources.map((company) => {
          if (!company.logo && company.id !== 'all' && company.url) {
            return {
              ...company,
              logo: getBestFaviconUrl(company.name, company.url),
            };
          }
          return company;
        });

        setCompanySources(updatedCompanies);
      }
    }
  }, []); // Run only once on mount, not when companySources changes

  // Handle company source actions
  const handleAddCompany = async () => {
    if (!newCompanyName) {
      toast.error('Company name is required');
      return;
    }

    if (!newCompanyDomain) {
      toast.error('Company domain is required');
      return;
    }

    try {
      const newCompany = await adminCompanyService.addCompany(newCompanyName, newCompanyDomain, newCompanyIsFirm);

      const formattedCompany: CompanySource = {
        id: newCompany._id,
        name: newCompany.name,
        logo: newCompany.favicon || getBestFaviconUrl(newCompany.name, newCompany.domain || ''),
        count: 0,
        selected: false,
        url: newCompany.domain || '',
        enabled: newCompany.enabled,
        is_firm: newCompany.is_firm,
      };

      setCompanySources((prev) => {
        const allCompany = prev.find((c) => c.id === 'all');
        const otherCompanies = prev.filter((c) => c.id !== 'all');

        return [
          { ...allCompany!, count: allCompany!.count + 1 },
          ...otherCompanies,
          formattedCompany,
        ];
      });

      setNewCompanyName('');
      setNewCompanyDomain('');
      setNewCompanyLogo('');
      setNewCompanyCount(0);
      setNewCompanyIsFirm(false);
      toast.success(`Added new company: ${newCompanyName}`);
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error('Failed to add company');
    }
  };

  const confirmDeleteCompany = (id: string) => {
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      // Call API to delete company using adminCompanyService
      await adminCompanyService.deleteCompany(companyToDelete);

      // Update local state
      setCompanySources((prev) => {
        const filteredCompanies = prev.filter((company) => company.id !== companyToDelete);
        const allCompany = filteredCompanies.find((c) => c.id === 'all');
        
        if (allCompany) {
          return [
            { ...allCompany, count: allCompany.count - 1 },
            ...filteredCompanies.filter((c) => c.id !== 'all'),
          ];
        }
        
        return filteredCompanies;
      });

      toast.success('Company deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    } finally {
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleToggleCompanyStatus = async (id: string, enabled: boolean) => {
    try {
      // Call API to update company status using adminCompanyService
      await adminCompanyService.updateCompanyStatus(id, enabled);

      // Update local state
      setCompanySources((prev) => prev.map((company) => (company.id === id ? { ...company, enabled } : company)));

      toast.success(`Company ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating company status:', error);
      toast.error('Failed to update company status');
    }
  };

  const handleToggleIsFirm = async (id: string, isFirm: boolean) => {
    try {
      await adminCompanyService.updateCompany(id, { is_firm: isFirm });
      setCompanySources((prev) => prev.map((company) => (company.id === id ? { ...company, is_firm: isFirm } : company)));
      toast.success('Company\'s firm status updated.');
    } catch (error) {
      console.error('Error updating firm status:', error);
      toast.error('Failed to update firm status.');
    }
  };

  const handleAddLogo = (id: string) => {
    setCompanySources((prev) => {
      const company = prev.find((c) => c.id === id);
      if (!company) return prev;

      // Generate favicon URL based on name and domain
      const faviconUrl = getBestFaviconUrl(company.name, company.url);

      // Update the company with the new logo
      const updatedCompanies = prev.map((c) => (c.id === id ? { ...c, logo: faviconUrl } : c));
      
      toast.success(`Generated logo for ${company.name}`);
      return updatedCompanies;
    });
  };

  // Filtered and sorted companies
  const filteredSortedCompanies = useMemo(() => {
    let result = [...companySources];

    // Apply search filter
    if (debouncedCompanySearch) {
      result = result.filter((company) => company.name.toLowerCase().includes(debouncedCompanySearch.toLowerCase()));
    }

    // Apply sort
    if (companySort === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (companySort === 'za') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [companySources, debouncedCompanySearch, companySort]);

  return (
    <TabContent
      title="Manage Companies"
      description="Add, edit or remove companies that appear on the home page."
      icon={<Briefcase className="h-5 w-5 text-primary" />}
    >
      <AddCompanyForm
        newCompanyName={newCompanyName}
        setNewCompanyName={setNewCompanyName}
        newCompanyLogo={newCompanyLogo}
        setNewCompanyLogo={setNewCompanyLogo}
        newCompanyCount={newCompanyCount}
        setNewCompanyCount={setNewCompanyCount}
        newCompanyDomain={newCompanyDomain}
        setNewCompanyDomain={setNewCompanyDomain}
        newCompanyIsFirm={newCompanyIsFirm}
        setNewCompanyIsFirm={setNewCompanyIsFirm}
        handleAddCompany={handleAddCompany}
        icon={<Building2 className="h-4 w-4" />}
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ContentList
          title="Current Companies"
                  searchValue={companySearch}
        onSearchChange={setCompanySearch}
        debounceDelay={1000}
          sortValue={companySort}
          onSortChange={(value) => setCompanySort(value as 'default' | 'az' | 'za')}
          viewType={activeView}
          onViewChange={setActiveView}
          sortOptions={companySortOptions}
          renderGridView={() => (
            <ContentGrid
              items={filteredSortedCompanies}
              renderCard={(company) => (
                <CompanyCard
                  company={company}
                  onDelete={confirmDeleteCompany}
                  onAddLogo={handleAddLogo}
                  onToggleStatus={handleToggleCompanyStatus}
                  onToggleIsFirm={handleToggleIsFirm}
                />
              )}
              gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
              gap="gap-3"
              emptyMessage="No companies found."
              getItemKey={(company) => company.id}
            />
          )}
          renderListView={() => (
            <CompanyListView
              companies={filteredSortedCompanies}
              onDelete={confirmDeleteCompany}
              onAddLogo={handleAddLogo}
              onToggleStatus={handleToggleCompanyStatus}
              onToggleIsFirm={handleToggleIsFirm}
            />
          )}
          icon={<Building2 className="h-4 w-4 mr-2 text-primary" />}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company and may affect content associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabContent>
  );
}

export default AdminCompaniesTab;
