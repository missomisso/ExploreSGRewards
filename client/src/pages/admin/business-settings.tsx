import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Building2,
  MapPin,
  Phone,
  Globe,
  Upload
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export default function BusinessSettings() {
  const { toast } = useToast();
  const { user, session } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessDescription: "",
    firstName: "",
    lastName: "",
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/users", user?.id],
    queryFn: async () => {
      if (!user?.id || !session?.access_token) return null;
      const res = await fetch(`/api/users/${user.id}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id && !!session?.access_token,
  });

  useEffect(() => {
    if (userData) {
      setBusinessData({
        businessName: userData.businessName || userData.business_name || "",
        businessDescription: userData.businessDescription || userData.business_description || "",
        firstName: userData.firstName || userData.first_name || "",
        lastName: userData.lastName || userData.last_name || "",
      });
    }
  }, [userData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof businessData) => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          businessName: data.businessName,
          businessDescription: data.businessDescription,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Settings Saved",
        description: "Your business profile has been updated.",
        className: "bg-green-600 text-white border-0",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(businessData);
  };

  if (isLoading) {
    return (
      <AdminLayout type="business">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="business">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/business">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">Business Settings</h1>
            <p className="text-muted-foreground">Manage your business profile and preferences.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>This information will be displayed to tourists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData?.profileImageUrl || userData?.profile_image_url} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {businessData.businessName?.charAt(0) || businessData.firstName?.charAt(0) || "B"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Recommended: 200x200px, PNG or JPG</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="businessName">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                    placeholder="Your business name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={businessData.businessDescription}
                    onChange={(e) => setBusinessData({ ...businessData, businessDescription: e.target.value })}
                    placeholder="Tell tourists about your business..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your personal details for account management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={businessData.firstName}
                    onChange={(e) => setBusinessData({ ...businessData, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={businessData.lastName}
                    onChange={(e) => setBusinessData({ ...businessData, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <span className="text-sm font-medium">Business</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">
                  {userData?.createdAt || userData?.created_at
                    ? new Date(userData.createdAt || userData.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your business account and all associated data.
              </p>
              <Button variant="destructive" className="w-full" disabled>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
