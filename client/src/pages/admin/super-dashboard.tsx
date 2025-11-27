import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  Map, 
  Gift, 
  MoreHorizontal, 
  AlertCircle, 
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SuperAdminDashboard() {
  // Mock Data
  const kpiData = [
    { title: "Total Businesses", value: "124", change: "+12%", icon: Building2, color: "text-blue-600 bg-blue-100" },
    { title: "Total Users", value: "15.2k", change: "+8%", icon: Users, color: "text-green-600 bg-green-100" },
    { title: "Active Missions", value: "843", change: "+24%", icon: Map, color: "text-purple-600 bg-purple-100" },
    { title: "Rewards Claimed", value: "2.1k", change: "+5%", icon: Gift, color: "text-orange-600 bg-orange-100" },
  ];

  const recentBusinesses = [
    { id: 1, name: "Marina Bay Sands Gift Shop", owner: "mbs@example.com", status: "Active", plan: "Enterprise", joined: "2 hours ago" },
    { id: 2, name: "Ah Hock Chicken Rice", owner: "hock@example.com", status: "Pending", plan: "Basic", joined: "5 hours ago" },
    { id: 3, name: "Sentosa Adventure Park", owner: "admin@sentosa.com", status: "Active", plan: "Enterprise", joined: "1 day ago" },
    { id: 4, name: "Little India Spices", owner: "raja@example.com", status: "Suspended", plan: "Pro", joined: "2 days ago" },
    { id: 5, name: "Orchard Ion Concierge", owner: "ion@example.com", status: "Active", plan: "Pro", joined: "3 days ago" },
  ];

  const alerts = [
    { id: 1, message: "3 New businesses pending approval", type: "warning" },
    { id: 2, message: "High volume of flagged photos (15) from 'Night Safari'", type: "destructive" },
  ];

  return (
    <AdminLayout type="super">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Platform Overview</h1>
          <p className="text-muted-foreground">Welcome back, Super Admin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Report</Button>
          <Button>Create New Business</Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="grid gap-4 mb-8">
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-center gap-3 p-4 rounded-lg border ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{alert.message}</span>
              <Button variant="ghost" size="sm" className="ml-auto h-8">Review</Button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">{kpi.change}</span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Businesses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Businesses</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage new registrations and account statuses.</p>
          </div>
          <Button variant="outline" size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell>{business.owner}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{business.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${
                        business.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                        business.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : 
                        'bg-red-100 text-red-700 hover:bg-red-100'
                      } border-0`}
                    >
                      {business.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{business.joined}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
