import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Banner } from "@shared/schema";

export function BannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['/api/banners'],
    refetchInterval: 10000, // Refetch every 10 seconds for admin changes
    staleTime: 5000, // Consider data fresh for 5 seconds only
    gcTime: 30000, // Keep in cache for 30 seconds
  });

  const visibleBanners = banners;

  useEffect(() => {
    if (visibleBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % visibleBanners.length);
    }, 7000); // Change slide every 7 seconds

    return () => clearInterval(interval);
  }, [visibleBanners.length]); // Only reset when banners change, not on slide change



  const handlePrevious = () => {
    setCurrentSlide(prev => prev === 0 ? visibleBanners.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % visibleBanners.length);
  };

  if (visibleBanners.length === 0) {
    // Default banner when no active banners
    return (
      <section className="gradient-hero text-white p-6 relative overflow-hidden h-[200px] flex items-center mx-4 mb-6 rounded-lg">
        <div className="relative z-10 flex flex-col justify-center h-full py-4">
          <div className="flex items-center mb-3">
            <div className="delivery-pulse bg-electric-green text-white px-3 py-1 rounded-full text-sm font-semibold mr-3 flex items-center">
              <Clock className="mr-1 w-4 h-4" />
              10-15 мин
            </div>
            <span className="text-white/80 text-sm">Экспресс доставка</span>
          </div>
          <h2 className="text-2xl font-bold mb-3 leading-tight">
            Доставка продуктов быстрее, чем поход в магазин
          </h2>
          <p className="text-white/90 leading-relaxed">
            Свежие продукты к вашему столу за 10-15 минут
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 floating-elements"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 floating-elements" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full floating-elements" style={{ animationDelay: '4s' }}></div>
      </section>
    );
  }

  const currentBanner = visibleBanners[currentSlide];

  const getGradientStyle = (backgroundColor: string) => {
    // Create a gradient from the banner color to a slightly darker version
    const color = backgroundColor || "#6366f1";
    return {
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
    };
  };

  const getBannerIcon = (type: string) => {
    switch (type) {
      case 'promo':
        return '🎉';
      case 'announcement':
        return '📢';
      case 'partnership':
        return '🤝';
      default:
        return '📢';
    }
  };

  return (
    <section 
      className="text-white p-6 relative overflow-hidden h-[200px] flex items-center mx-4 rounded-lg mt-[11px] mb-[11px] ml-[22px] mr-[22px] pl-[23px] pr-[23px] text-center bg-[#00539A]"
      style={{
        ...getGradientStyle(currentBanner.backgroundColor || "#6366f1"),
        color: currentBanner.textColor || "#ffffff"
      }}
    >
      {/* Navigation arrows (only show if multiple banners) */}
      {visibleBanners.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors shadow-lg"
            aria-label="Предыдущий баннер"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors shadow-lg"
            aria-label="Следующий баннер"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      {/* Banner content */}
      <div className="relative z-10 w-full flex flex-col justify-center h-full py-4">
        <div className="flex items-center mb-3">
          {(currentBanner.subtitle === 'Экспресс доставка' && currentBanner.priority === 0) && (
            <div className="delivery-pulse bg-electric-green text-white px-3 py-1 rounded-full text-sm font-semibold mr-3 flex items-center">
              <Clock className="mr-1 w-4 h-4" />
              10-15 мин
            </div>
          )}
          {currentBanner.subtitle && (
            <span className="text-white/80 text-sm">
              {currentBanner.subtitle === 'Экспресс доставка' && currentBanner.priority === 0 ? '🎉' : ''} 
              {!(currentBanner.subtitle === 'Экспресс доставка' && currentBanner.priority === 0) && getBannerIcon(currentBanner.type)} {currentBanner.subtitle}
            </span>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-3 leading-tight">
          {currentBanner.title}
        </h2>
        
        <p className="text-white/90 mb-4 max-w-md leading-relaxed">
          {currentBanner.message}
        </p>

        {currentBanner.buttonText && currentBanner.buttonLink && (
          <div className="mt-auto">
            <Link href={currentBanner.buttonLink}>
              <Button 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {currentBanner.buttonText}
              </Button>
            </Link>
          </div>
        )}
      </div>
      {/* Pagination dots */}
      {visibleBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 mt-[-15px] mb-[-15px]">
          {visibleBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      )}
      {/* Floating decorative elements - show for all banners but more prominent for main banner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 floating-elements"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 floating-elements" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full floating-elements" style={{ animationDelay: '4s' }}></div>
      {/* Extra animation elements for main banner */}
      {currentBanner.priority === 0 && (
        <>
          <div className="absolute top-1/4 left-3/4 w-20 h-20 bg-white/8 rounded-full floating-elements" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 right-1/2 w-12 h-12 bg-white/6 rounded-full floating-elements" style={{ animationDelay: '3s' }}></div>
        </>
      )}
    </section>
  );
}