import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminCmsContextValue } from "@/hooks/useAdminCms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { canManageUsers } from "@/lib/auth-roles";
import { useAuth } from "@/contexts/AuthContext";
import { RotateCcw } from "lucide-react";

const Revisions = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const { payload, setPayload, savePayload, rowId } = useOutletContext<AdminCmsContextValue>();
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = canManageUsers(role); // Only admins can rollback

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    const loadRevisions = async () => {
      const { data, error } = await supabase
        .from("revisions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        toast({ title: "Failed to load revisions", description: error.message, variant: "destructive" });
      } else {
        setRevisions(data || []);
      }
      setLoading(false);
    };
    loadRevisions();
  }, [toast]);

  const rollback = async (rev: any) => {
    if (!canManage) return;
    if (rev.resource_type === "block") {
      const block = rev.snapshot as ContentBlock;
      setPayload({ ...payload, blocks: payload.blocks.map(b => b.id === block.id ? block : b) });
      const r = await savePayload(payload);
      if (r.error) {
        toast({ title: "Rollback failed", description: r.error, variant: "destructive" });
      } else {
        toast({ title: "Rolled back block" });
      }
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Only admins can view and manage revisions.
        </CardContent>
      </Card>
    );
  }

  if (loading) return <p>Loading revisions…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Revision History</h2>
      {revisions.map((rev) => (
        <Card key={rev.id}>
          <CardContent className="pt-6">
            <p className="text-sm">
              {rev.resource_type} {rev.resource_id} - {new Date(rev.created_at).toLocaleString()} by {rev.created_by_email}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => rollback(rev)}
              className="mt-2"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Revisions;