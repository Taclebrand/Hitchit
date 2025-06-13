import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { User, Camera, Edit2, Check, X } from "lucide-react";

export default function QuickProfileCustomization() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;

    setIsUpdating(true);
    try {
      await updateProfile(currentUser, {
        displayName: displayName
      });
      
      toast({
        title: "Profile Updated",
        description: "Your display name has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(currentUser?.displayName || '');
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!currentUser) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Quick Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center profile-glow">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'User'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {getInitials(currentUser.displayName || currentUser.email || 'U')}
                </span>
              )}
            </div>
            <button 
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              aria-label="Change profile picture"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="text-base font-medium"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isUpdating || !displayName.trim()}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {currentUser.displayName || 'Anonymous User'}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Edit display name"
                  >
                    <Edit2 className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">0</div>
            <div className="text-xs text-muted-foreground">Trips</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">★ 0.0</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">0</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
        </div>

        <Separator />

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {currentUser.emailVerified ? "✓ Verified" : "⚠ Unverified"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Member since {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            })}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}