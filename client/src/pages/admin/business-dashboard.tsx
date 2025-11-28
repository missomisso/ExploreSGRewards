import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  MapPin, 
  QrCode, 
  ClipboardCheck, 
  Plus,
  Clock,
  Trophy
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Link } from "wouter";

export default function BusinessAdminDashboard() {
  // Mock Data for Business Admin
  const stats = [
    { title: "Total Visits", value: "1,245", icon: MapPin, color: "text-blue-600 bg-blue-100" },
    { title: "Missions Started", value: "850", icon: Store, color: "text-purple-600 bg-purple-100" },
    { title: "Rewards Claimed", value: "320", icon: Trophy, color: "text-yellow-600 bg-yellow-100" },
    { title: "Pending Reviews", value: "12", icon: ClipboardCheck, color: "text-orange-600 bg-orange-100" },
  ];

  const activeMissions = [
    { id: 1, title: "Try our Signature Dish", type: "Receipt Upload", completions: 145, status: "Active" },
    { id: 2, title: "Selfie with the Chef", type: "Photo", completions: 89, status: "Active" },
    { id: 3, title: "Secret Menu Quiz", type: "Quiz", completions: 210, status: "Ending Soon" },
  ];

  const pendingSubmissions = [
    { id: 1, user: "Alice Tan", mission: "Selfie with the Chef", type: "Photo", time: "10 mins ago" },
    { id: 2, user: "John Doe", mission: "Try our Signature Dish", type: "Receipt", time: "25 mins ago" },
    { id: 3, user: "Sarah Lee", mission: "Selfie with the Chef", type: "Photo", time: "1 hour ago" },
  ];

  return (
    <AdminLayout type="business">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">Manage your locations, missions, and customer rewards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <QrCode className="h-4 w-4" /> Print QR Codes
          </Button>
          <Link href="/admin/business/missions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Mission
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center p-6">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Missions List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Missions</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Completions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMissions.map((mission) => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">{mission.title}</TableCell>
                    <TableCell>{mission.type}</TableCell>
                    <TableCell>{mission.completions}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={mission.status === 'Ending Soon' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-green-600 border-green-200 bg-green-50'}>
                        {mission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Submissions Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Reviews
              <Badge variant="secondary">12</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{sub.user}</p>
                    <p className="text-xs text-muted-foreground">{sub.mission}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {sub.time}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6" variant="secondary" asChild>
              <Link href="/admin/business/verification">View All Pending</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
