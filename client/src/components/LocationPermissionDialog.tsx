import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface LocationPermissionDialogProps {
  open: boolean;
  onPermissionResponse: (permission: "while_using" | "once" | "deny") => void;
  isLoading?: boolean;
}

export default function LocationPermissionDialog({
  open,
  onPermissionResponse,
  isLoading = false
}: LocationPermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePermissionRequest = async (permission: "while_using" | "once" | "deny") => {
    if (isRequesting || isLoading) return;

    setIsRequesting(true);
    
    // Add a small delay to show the user something is happening
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onPermissionResponse(permission);
    setIsRequesting(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md mx-4 rounded-3xl p-0 gap-0 border-0 shadow-2xl [&>button]:hidden"
      >
        <div className="px-6 py-8 text-center">
          {/* Location Pin Icon */}
          <div className="mx-auto mb-6 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <MapPin className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
            Разрешить приложению<br />
            DUCHARKHA доступ к<br />
            данным о местоположении<br />
            устройства?
          </h2>

          {/* Visual Elements */}
          <div className="flex justify-center gap-8 mb-8">
            {/* Precise Location */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 relative">
                {/* Grid background */}
                <div className="w-full h-full border-2 border-blue-500 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 64 64" className="w-full h-full">
                      <defs>
                        <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="64" height="64" fill="url(#grid)" />
                    </svg>
                  </div>
                  {/* Center point */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full">
                    <div className="w-full h-full bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                  {/* Small dots */}
                  <div className="absolute top-6 left-4 w-1 h-1 bg-blue-400 rounded-full"></div>
                  <div className="absolute bottom-4 right-6 w-1 h-1 bg-blue-400 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Точно</p>
            </div>

            {/* Approximate Location */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 relative">
                {/* Map-like background */}
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden">
                  {/* Road lines */}
                  <svg viewBox="0 0 64 64" className="w-full h-full absolute inset-0">
                    <path d="M10 20 Q30 15 50 25" stroke="#fbbf24" strokeWidth="2" fill="none"/>
                    <path d="M15 35 Q25 30 45 40" stroke="#fbbf24" strokeWidth="2" fill="none"/>
                    <path d="M20 50 Q35 45 55 55" stroke="#fbbf24" strokeWidth="2" fill="none"/>
                    <path d="M25 10 L25 25" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
                    <path d="M40 25 L40 45" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
                  </svg>
                  {/* Location indicator */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full">
                    <div className="w-full h-full bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Приблизительно</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Button - While Using App */}
            <Button
              onClick={() => handlePermissionRequest("while_using")}
              disabled={isRequesting || isLoading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
              data-testid="button-allow-while-using"
            >
              {isRequesting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Получаем разрешение...
                </div>
              ) : (
                "При использовании приложения"
              )}
            </Button>

            {/* Secondary Button - Just This Time */}
            <Button
              onClick={() => handlePermissionRequest("once")}
              disabled={isRequesting || isLoading}
              variant="outline"
              className="w-full h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-xl border border-gray-300 dark:border-gray-600 transition-colors"
              data-testid="button-allow-once"
            >
              Только в этот раз
            </Button>

            {/* Deny Button */}
            <Button
              onClick={() => handlePermissionRequest("deny")}
              disabled={isRequesting || isLoading}
              variant="ghost"
              className="w-full h-12 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              data-testid="button-deny"
            >
              Запретить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}