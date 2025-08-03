import React, { useState, useEffect } from 'react';
import {
  Loader2, User, Shield, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/utils/api';
import { User as UserType } from '@/types/shared';
import TabContent from '@/components/admin/TabContent';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface ApiUser {
  _id: string;
  email: string;
  role: string;
}

function AdminUsersTab() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<{ users: ApiUser[] }>('/users');
        // Convert API users to UserType with proper role typing
        const convertedUsers: UserType[] = response.data.users.map((user) => ({
          ...user,
          role: user.role as 'admin' | 'editor' | 'viewer' | 'user',
        }));
        setUsers(convertedUsers);
      } catch (error) {
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api.put('/users/update-role', { userId, newRole });
      setUsers(users.map((user) => (user._id === userId ? { ...user, role: newRole as 'admin' | 'editor' | 'viewer' | 'user' } : user)));
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <TabContent
      title="Manage Users"
      description="View and manage user accounts and permissions."
      icon={<User className="h-5 w-5 text-primary" />}
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display font-bold text-foreground">User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-sm font-medium text-foreground">Email</TableHead>
                    <TableHead className="text-sm font-medium text-foreground">Role</TableHead>
                    <TableHead className="text-sm font-medium text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} className="border-border">
                      <TableCell className="flex items-center gap-2 text-foreground">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user._id, value)}
                        >
                          <SelectTrigger className="w-[120px] border-border bg-background">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <span className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {' '}
                                User
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                {' '}
                                Admin
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {updatingId === user._id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabContent>
  );
}

export default AdminUsersTab;
