import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-8" data-testid="page-dashboard">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-app-title">
            Vudy OTC Hub
          </h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Migration to Replit Fullstack Environment
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-transactions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-transactions">0</div>
              <p className="text-xs text-muted-foreground">
                Migration in progress
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-buy-orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Buy Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-buy-orders">0</div>
              <p className="text-xs text-muted-foreground">
                Migration in progress
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-sell-orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sell Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-sell-orders">0</div>
              <p className="text-xs text-muted-foreground">
                Migration in progress
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-processed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-processed">$0</div>
              <p className="text-xs text-muted-foreground">
                Migration in progress
              </p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-migration-status">
          <CardHeader>
            <CardTitle>Migration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" data-testid="status-backend">✅</span>
                <p className="text-sm">Backend API routes configured</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg" data-testid="status-database">✅</span>
                <p className="text-sm">Database schema migrated to Drizzle ORM</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg" data-testid="status-auth">✅</span>
                <p className="text-sm">Authentication system implemented</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg" data-testid="status-vite">✅</span>
                <p className="text-sm">Vite configuration updated for Replit</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg" data-testid="status-frontend">🔄</span>
                <p className="text-sm">Frontend components migration in progress...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-next-steps">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">• Migrate authentication pages (Auth.tsx)</p>
              <p className="text-sm">• Migrate profile and bank accounts pages</p>
              <p className="text-sm">• Migrate transaction components (KanbanBoard, etc.)</p>
              <p className="text-sm">• Migrate hooks (useNotifications)</p>
              <p className="text-sm">• Migrate sidebar and header components</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="default" data-testid="button-go-auth">
            Go to Auth Page
          </Button>
          <Button variant="outline" data-testid="button-check-api">
            Check API Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
