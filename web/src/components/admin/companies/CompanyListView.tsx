import React from 'react';
import {
  Trash2, Image, PowerOff, Power,
} from 'lucide-react';
import { CompanySource } from '@/types/admin';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

interface CompanyListViewProps {
  companies: CompanySource[];
  onDelete: (id: string) => void;
  onAddLogo: (id: string) => void;
  onToggleStatus: (id: string, enabled: boolean) => void;
  onToggleIsFirm: (id: string, isFirm: boolean) => void;
}

const CompanyListView: React.FC<CompanyListViewProps> = ({
  companies, onDelete, onAddLogo, onToggleStatus, onToggleIsFirm,
}) => {
  if (!companies || companies.length === 0) {
    return <p className="text-center text-muted-foreground py-6">No companies found.</p>;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Logo</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Domain</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Firm</th>
            <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="px-3 py-3">
                {company.logo ? (
                  <OptImage
                    src={company.logo}
                    alt={company.name}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <div className="h-8 w-8 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-muted-foreground font-medium text-sm">{company.name.charAt(0)}</span>
                  </div>
                )}
              </td>
              <td className="px-3 py-3 font-medium text-foreground">{company.name}</td>
              <td className="px-3 py-3 text-sm text-muted-foreground">{company.url || '-'}</td>
              <td className="px-3 py-3 text-sm">
                {company.id !== 'all' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    company.enabled
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                  >
                    {company.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </td>
              <td className="px-3 py-3">
                {company.id !== 'all' && (
                  <input
                    type="checkbox"
                    checked={company.is_firm}
                    onChange={(e) => onToggleIsFirm(company.id, e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                  />
                )}
              </td>
              <td className="px-3 py-3 text-right">
                {company.id !== 'all' && (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleStatus(company.id, !company.enabled)}
                      className="px-2 py-1 h-auto text-xs border-border bg-background hover:bg-muted"
                    >
                      {company.enabled ? (
                        <PowerOff className="h-3 w-3 text-destructive" />
                      ) : (
                        <Power className="h-3 w-3 text-primary" />
                      )}
                    </Button>
                    {!company.logo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddLogo(company.id)}
                        className="px-2 py-1 h-auto text-xs border-border bg-background hover:bg-muted"
                      >
                        <Image className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(company.id)}
                      className="px-2 py-1 h-auto text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyListView;
