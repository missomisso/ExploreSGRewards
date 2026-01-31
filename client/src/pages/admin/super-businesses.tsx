import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft,
  Search, 
  MoreHorizontal, 
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOCK_BUSINESSES = [
  { id: 1, name: "Marina Bay Sands Gift Shop", owner: "mbs@example.com", status: "Active", plan: "Enterprise", missions: 12, joined: "Jan 2024" },
  { id: 2, name: "Ah Hock Chicken Rice", owner: "hock@example.com", status: "Pending", plan: "Basic", missions: 0, joined: "Jan 2026" },
  { id: 3, name: "Sentosa Adventure Park", owner: "admin@sentosa.com", status: "Active", plan: "Enterprise", missions: 25, joined: "Dec 2023" },
  { id: 4, name: "Little India Spices", owner: "raja@example.com", status: "Suspended", plan: "Pro", missions: 5, joined: "Nov 2024" },
  { id: 5, name: "Orchard Ion Concierge", owner: "ion@example.com", status: "Active", plan: "Pro", missions: 8, joined: "Oct 2024" },
  { id: 6, name: "Gardens by the Bay", owner: "gardens@example.com", status: "Active", plan: "Enterprise", missions: 18, joined: "Sep 2023" },
];

export default function SuperBusinesses() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState(MOCK_BUSINESSES);

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.owner.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "Suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleApprove = (id: number) => {
    setBusinesses(businesses.map(b => 
      b.id === id ? { ...b, status: "Active" } : b
    ));
    toast({
      title: "Business Approved",
      description: "The business account has been activated.",
      className: "bg-green-600 text-white border-0",
    });
  };

  const handleSuspend = (id: number) => {
    setBusinesses(businesses.map(b => 
      b.id === id ? { ...b, status: "Suspended" } : b
    ));
    toast({
      title: "Business Suspended",
      description: "The business account has been suspended.",
      variant: "destructive",
    });
  };

  return (
    <AdminLayout type="super">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/super">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold">Business Management</h1>
            <p className="text-muted-foreground">Approve and manage business accounts.</p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Business
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{businesses.length}</div>
            <p className="text-muted-foreground text-sm">Total Businesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {businesses.filter(b => b.status === "Active").length}
            </div>
            <p className="text-muted-foreground text-sm">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {businesses.filter(b => b.status === "Pending").length}
            </div>
            <p className="text-muted-foreground text-sm">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {businesses.filter(b => b.status === "Suspended").length}
            </div>
            <p className="text-muted-foreground text-sm">Suspended</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBusinesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold">No businesses found</h3>
              <p className="text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Missions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.name}</TableCell>
                    <TableCell className="text-muted-foreground">{business.owner}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{business.plan}</Badge>
                    </TableCell>
                    <TableCell>{business.missions}</TableCell>
                    <TableCell>{getStatusBadge(business.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{business.joined}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {business.status === "Pending" && (
                            <DropdownMenuItem 
                              className="text-green-600"
                              onClick={() => handleApprove(business.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            </DropdownMenuItem>
                          )}
                          {business.status !== "Suspended" && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleSuspend(business.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
