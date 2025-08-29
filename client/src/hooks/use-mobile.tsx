import * as React from "react"

const MOBILE_BREAKPOINT = 768
const SMALL_MOBILE_BREAKPOINT = 480

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState({
    isSmallMobile: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0
  })

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        isSmallMobile: width < SMALL_MOBILE_BREAKPOINT,
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < 1024,
        isDesktop: width >= 1024,
        width,
        height
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    window.addEventListener('orientationchange', updateScreenSize)
    
    return () => {
      window.removeEventListener('resize', updateScreenSize)
      window.removeEventListener('orientationchange', updateScreenSize)
    }
  }, [])

  return screenSize
}

export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = React.useState(0)

  React.useEffect(() => {
    const updateHeight = () => {
      // Use visual viewport API if available for better mobile support
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height)
      } else {
        setViewportHeight(window.innerHeight)
      }
    }

    updateHeight()
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight)
      return () => window.visualViewport?.removeEventListener('resize', updateHeight)
    } else {
      window.addEventListener('resize', updateHeight)
      return () => window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return viewportHeight
}
