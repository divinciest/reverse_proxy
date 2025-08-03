import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';

interface AddCompanyFormProps {
  newCompanyName: string;
  setNewCompanyName: (name: string) => void;
  newCompanyLogo: string;
  setNewCompanyLogo: (logo: string) => void;
  newCompanyCount: number;
  setNewCompanyCount: (count: number) => void;
  newCompanyDomain: string;
  setNewCompanyDomain: (domain: string) => void;
  newCompanyIsFirm: boolean;
  setNewCompanyIsFirm: (isFirm: boolean) => void;
  handleAddCompany: () => void;
  icon: React.ReactNode;
}

const AddCompanyForm: React.FC<AddCompanyFormProps> = ({
  newCompanyName,
  setNewCompanyName,
  newCompanyLogo,
  setNewCompanyLogo,
  newCompanyCount,
  setNewCompanyCount,
  newCompanyDomain,
  setNewCompanyDomain,
  newCompanyIsFirm,
  setNewCompanyIsFirm,
  handleAddCompany,
  icon,
}) => (
  <Card className="mb-6 bg-card border-border shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-display font-bold flex items-center text-foreground">
        {icon}
        <span className="ml-2">Add New Company</span>
      </CardTitle>
      <CardDescription className="text-muted-foreground">
        Add a new company to the platform
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium text-foreground">Company Name</Label>
          <Input
            id="companyName"
            placeholder="e.g., Apple Inc."
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyDomain" className="text-sm font-medium text-foreground">Company Domain</Label>
          <Input
            id="companyDomain"
            placeholder="e.g., apple.com"
            value={newCompanyDomain}
            onChange={(e) => setNewCompanyDomain(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyLogo" className="text-sm font-medium text-foreground">Logo URL (Optional)</Label>
          <Input
            id="companyLogo"
            placeholder="https://example.com/logo.png"
            value={newCompanyLogo}
            onChange={(e) => setNewCompanyLogo(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Leave empty to auto-generate from domain</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyCount" className="text-sm font-medium text-foreground">Display Count (Optional)</Label>
          <Input
            id="companyCount"
            type="number"
            min="0"
            placeholder="0"
            value={newCompanyCount}
            onChange={(e) => setNewCompanyCount(parseInt(e.target.value) || 0)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="isFirm"
          checked={newCompanyIsFirm}
          onChange={(e) => setNewCompanyIsFirm(e.target.checked)}
          className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
        />
        <Label htmlFor="isFirm" className="text-sm text-foreground">This is a firm</Label>
      </div>
    </CardContent>
    <CardFooter className="pt-3 border-t border-border">
      <Button onClick={handleAddCompany} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
        Add Company
      </Button>
    </CardFooter>
  </Card>
);

export default AddCompanyForm;
