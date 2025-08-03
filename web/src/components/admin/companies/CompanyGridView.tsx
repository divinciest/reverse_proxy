import React from 'react';
import {
  Trash2, Image, PowerOff, Power,
} from 'lucide-react';
import { CompanySource } from '@/types/admin';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

interface CompanyGridViewProps {
  companies: CompanySource[];
  onDelete: (id: string) => void;
  onAddLogo: (id: string) => void;
  onToggleStatus: (id: string, enabled: boolean) => void;
  onToggleIsFirm: (id: string, isFirm: boolean) => void;
}

const CompanyGridView: React.FC<CompanyGridViewProps> = ({
  companies, onDelete, onAddLogo, onToggleStatus, onToggleIsFirm,
}) => {
  if (!companies || companies.length === 0) {
    return <p className="text-center text-muted-foreground py-6">No companies found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {companies.map((company) => (
        <Card key={company.id} className="flex flex-col justify-between hover:shadow-md transition-all duration-200 bg-card border-border shadow-sm">
          <div className="aspect-video relative bg-muted flex justify-center items-center">
            {company.logo ? (
              <OptImage
                src={company.logo}
                alt={company.name}
                className="max-h-full max-w-full object-contain p-3"
              />
            ) : (
              <div className="text-muted-foreground text-xl font-bold">{company.name.charAt(0)}</div>
            )}
          </div>
          <CardContent className="p-3">
            <h3 className="font-semibold text-sm truncate text-foreground">{company.name}</h3>
            {company.url && (
              <p className="text-xs text-muted-foreground truncate mt-1">{company.url}</p>
            )}
          </CardContent>
          <CardFooter className="p-3 pt-0 justify-between items-center border-t border-border mt-auto">
            {company.id !== 'all' && (
              <>
                <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id={`is-firm-${company.id}`}
                      checked={company.is_firm}
                      onChange={(e) => onToggleIsFirm(company.id, e.target.checked)}
                      className="h-3 w-3 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <label htmlFor={`is-firm-${company.id}`} className="text-xs text-foreground">Firm</label>
                  </div>
                </div>
                <div className="flex gap-1">
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
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CompanyGridView;
