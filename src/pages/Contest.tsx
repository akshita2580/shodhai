import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Code2, Trophy, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TestCase = {
  input: string;
  expectedOutput: string;
};

type Problem = {
  id: string;
  title: string;
  description: string;
  test_cases: TestCase[];
  score: number;
};

type LeaderboardEntry = {
  username: string;
  total_score: number;
  user_id: string;
};

const Contest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchProblems();
    fetchLeaderboard();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const interval = setInterval(fetchLeaderboard, 15000);
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [contestId, navigate]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        navigate("/auth");
        return;
      }

      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchUserProfile(session.user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Profile error:", error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchProblems = async () => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("contest_id", contestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load problems",
        variant: "destructive",
      });
    } else if (data) {
      const problems = data.map((p) => ({
        ...p,
        test_cases: p.test_cases as TestCase[],
      }));
      setProblems(problems);
      if (problems.length > 0) setSelectedProblem(problems[0]);
    }
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase.rpc("get_contest_leaderboard", {
      contest_id_param: contestId,
    });

    if (!error && data) {
      setLeaderboard(data);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem || !code.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Simulate code execution
      const isAccepted = Math.random() > 0.3;
      const status = isAccepted ? "Accepted" : "Wrong Answer";
      const score = isAccepted ? selectedProblem.score : 0;

      const { error } = await supabase.from("submissions").insert({
        user_id: user.id,
        contest_id: contestId,
        problem_id: selectedProblem.id,
        code,
        language,
        status,
        score,
        output: isAccepted
          ? "All test cases passed!"
          : "Test case 1 failed: Expected output doesn't match",
      });

      if (error) throw error;

      toast({
        title: status,
        description: isAccepted
          ? `Great! You earned ${score} points!`
          : "Try again!",
        variant: isAccepted ? "default" : "destructive",
      });

      fetchLeaderboard();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Code2 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Code2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Shodh-a-Code</h1>
              {userProfile && (
                <p className="text-sm text-muted-foreground">
                  Welcome, {userProfile.username}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Problems</CardTitle>
                  <Select
                    value={selectedProblem?.id}
                    onValueChange={(id) =>
                      setSelectedProblem(problems.find((p) => p.id === id) || null)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select problem" />
                    </SelectTrigger>
                    <SelectContent>
                      {problems.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} ({p.score}pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProblem && (
                  <Tabs defaultValue="description">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="description">Description</TabsTrigger>
                      <TabsTrigger value="editor">Code Editor</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{selectedProblem.title}</h3>
                        <p className="text-muted-foreground mb-4">{selectedProblem.description}</p>
                        <div className="space-y-2">
                          <h4 className="font-semibold">Test Cases:</h4>
                          {selectedProblem.test_cases.map((tc, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium">Input:</span> {tc.input}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Expected:</span> {tc.expectedOutput}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="editor" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Language</label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="cpp">C++</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder="Write your code here..."
                          className="min-h-[400px] font-mono"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                        <Button
                          onClick={handleSubmit}
                          className="w-full"
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Code"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={idx < 3 ? "default" : "outline"}>
                          #{idx + 1}
                        </Badge>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                      <span className="text-primary font-bold">{entry.total_score}</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No submissions yet. Be the first!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contest;