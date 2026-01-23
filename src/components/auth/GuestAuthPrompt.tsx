import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, UserPlus, ArrowRight } from "lucide-react";

interface GuestAuthPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  action?: string;
}

export function GuestAuthPrompt({
  open,
  onOpenChange,
  title = "Sign in to Continue",
  description = "Create an account or sign in to access this feature",
  action = "booking",
}: GuestAuthPromptProps) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onOpenChange(false);
    navigate("/signin", { state: { redirectAfterAuth: window.location.pathname } });
  };

  const handleSignUp = () => {
    onOpenChange(false);
    navigate("/signup", { state: { redirectAfterAuth: window.location.pathname } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            variant="gradient"
            className="w-full h-12"
            onClick={handleSignIn}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleSignUp}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
