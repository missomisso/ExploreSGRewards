import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Edit,
  Trash2,
  Gift,
  Plus,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function SuperRewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    merchant: "",
    cost: 500,
    icon: "Gift",
    expiryDays: 30,
  });

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create reward");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setShowCreateDialog(false);
      setNewReward({
        title: "",
        description: "",
        merchant: "",
        cost: 500,
        icon: "Gift",
        expiryDays: 30,
      });
      toast({
        title: "Reward Created",
        description: "The new reward is now available.",
        className: "bg-green-600 text-white border-0",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create reward.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/rewards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reward");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({ title: "Reward deleted" });
    },
  });

  const filteredRewards = rewards.filter((r: any) =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.merchant?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newReward.title || !newReward.merchant) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      });
      return;
    }
    createMutation.mutate(newReward);
  };

  if (isLoading) {
    return (
      <AdminLayout type="super">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
        </div>
      </AdminLayout>
    );
  }

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
            <h1 className="text-3xl font-heading font-bold">Rewards Management</h1>
            <p className="text-muted-foreground">Create and manage platform rewards.</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" /> Create Reward
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{rewards.length}</div>
            <p className="text-muted-foreground text-sm">Total Rewards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {rewards.reduce((sum: number, r: any) => sum + (r.cost || 0), 0)}
            </div>
            <p className="text-muted-foreground text-sm">Total Point Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(rewards.map((r: any) => r.merchant)).size}
            </div>
            <p className="text-muted-foreground text-sm">Partner Merchants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold">No rewards found</h3>
              <p className="text-muted-foreground mb-4">Create your first reward to get started.</p>
              <Button onClick={() => setShowCreateDialog(true)}>Create Reward</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards.map((reward: any) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="font-medium">{reward.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {reward.description}
                      </div>
                    </TableCell>
                    <TableCell>{reward.merchant}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {reward.cost} pts
                    </TableCell>
                    <TableCell>{reward.expiryDays} days</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(reward.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newReward.title}
                onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                placeholder="e.g., 1-for-1 Bubble Tea"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Describe the reward..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant *</Label>
              <Input
                id="merchant"
                value={newReward.merchant}
                onChange={(e) => setNewReward({ ...newReward, merchant: e.target.value })}
                placeholder="e.g., LiHO Tea"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Points Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  value={newReward.cost}
                  onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry (days)</Label>
                <Input
                  id="expiry"
                  type="number"
                  value={newReward.expiryDays}
                  onChange={(e) => setNewReward({ ...newReward, expiryDays: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
