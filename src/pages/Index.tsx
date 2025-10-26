import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Trophy, Users, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate("/contest/00000000-0000-0000-0000-000000000001");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        navigate("/contest/00000000-0000-0000-0000-000000000001");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <Code2 className="h-20 w-20 text-primary" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">Shodh-a-Code</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the ultimate coding contest platform. Solve problems, compete with others, and climb the leaderboard!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Compete</CardTitle>
              <CardDescription>
                Challenge yourself with algorithmic problems
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                Track your progress and compete globally
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Real-time</CardTitle>
              <CardDescription>
                Live updates and instant feedback
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
