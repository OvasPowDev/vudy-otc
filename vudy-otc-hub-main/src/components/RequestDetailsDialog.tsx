import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, CheckCircle, Clock, Upload, AlertCircle } from "lucide-react";

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
}

export function RequestDetailsDialog({ open, onOpenChange, requestId }: RequestDetailsDialogProps) {
  const steps = [
    {
      id: 1,
      title: "Escrow Created",
      description: "The escrow smart contract has been created and is ready for the trade",
      status: "completed",
      details: {
        address: "0x4235D9481d3f71C7C21e480bE136053E74604",
        bank: "NEXA - CHFONING",
        transaction: "10100108644",
      },
    },
    {
      id: 2,
      title: "Upload Payment Proof",
      description: "Upload proof of payment to proceed with the trade",
      status: "current",
    },
    {
      id: 3,
      title: "Verify Proof",
      description: "Verify the payment proof and approve the trade",
      status: "pending",
    },
    {
      id: 4,
      title: "Trade Completed",
      description: "The trade has been successfully completed",
      status: "pending",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-2"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Market
          </Button>
          <DialogTitle className="text-2xl">Request {requestId}</DialogTitle>
          <p className="text-sm text-muted-foreground">Sell GTQ with USDT</p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Request Details</h3>
                <p className="text-xs text-muted-foreground mb-4">Created on Oct 6, 2025, 10:52 PM</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User fullname</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Omar Vinicio Alvarez Suchini</p>
                      <Badge variant="outline">KYC</Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline">Download</Button>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="default">SELL</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="bg-blue-500">In Progress</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Buy Token</p>
                    <p className="font-medium">GTQ (Fiat)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sell Token</p>
                    <p className="font-medium">USDT (Optimism)</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Amount to Buy</p>
                    <p className="font-medium">200 GTQ</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount to Sell</p>
                    <p className="font-medium">25 USDT</p>
                    <p className="text-xs text-muted-foreground">Vudy fee (0.50%): 0.125 USDT</p>
                    <p className="text-xs text-muted-foreground">Total amount: 24.875 USDT</p>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Sender Wallet</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">0x4s484...7710</p>
                      <Copy className="h-4 w-4 cursor-pointer" />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Provider Wallet</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">0x466F...735d</p>
                      <Copy className="h-4 w-4 cursor-pointer" />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Bank Info</p>
                    <p className="font-medium">NEXA (GT)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Escrow Process</h3>
                <p className="text-sm text-muted-foreground mb-6">Active Escrow</p>

                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full p-2 ${
                            step.status === "completed"
                              ? "bg-green-500 text-white"
                              : step.status === "current"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : step.status === "current" ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`w-0.5 h-16 ${
                              step.status === "completed" ? "bg-green-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.details && (
                          <div className="mt-3 space-y-2 bg-muted p-3 rounded">
                            <div>
                              <p className="text-xs text-muted-foreground">Escrow Address</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs">{step.details.address}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Payment Bank Info</p>
                              <p className="text-xs font-medium">{step.details.bank}</p>
                              <p className="font-mono text-xs text-blue-500">{step.details.transaction}</p>
                            </div>
                            <Button size="sm" className="mt-2">
                              View Escrow on Explorer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      V
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Vudy Wallet</h4>
                    <p className="text-xs text-muted-foreground">0xC6f8...46Cd</p>
                    <p className="text-xs text-muted-foreground">Balance: 1 USDT</p>
                    <Button size="sm" variant="destructive" className="mt-2 w-full">
                      Please connect the correct wallet to proceed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Offers</h4>
                <p className="text-sm text-muted-foreground mb-4">1 offers received</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm">1h</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Token Amount</p>
                      <p className="text-sm font-medium">200.00 GTQ</p>
                    </div>
                    <Badge className="bg-green-500">Accepted</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
