"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { 
  Leaf,
  Waves,
  Cherry,
  Trees,
  Sunset,
  CloudSun,
  MoonStar,
  Binary,
  Skull,
  Palette,
  Clock,
  Computer,
  Cpu,
  SunSnow
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false);
  const [savedTheme, setSavedTheme] = React.useState<string | undefined>(theme);
  const previewThemeRef = React.useRef<string | undefined>(theme); 
  const monospacedThemes = ["cyberpunk", "vaporwave", "hacker"]
  // Wait until the component has mounted to prevent hydration issues
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const renderIcon = () => {
    if (!mounted) return null; // Ensure we don't render until mounted
    const currentTheme = theme === 'system' ? systemTheme : theme
    switch (currentTheme) {
      case 'light':
        return <SunIcon className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'dark':
        return  <MoonIcon className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'fall':
        return <Leaf className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'cherry':
        return <Cherry className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'ocean':
        return <Waves className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'forest':
        return <Trees className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'sunset':
        return <Sunset className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'light-solarized':
        return <CloudSun className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'dark-solarized':
        return <MoonStar className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'cyberpunk':
        return <Binary className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'gothic':
        return <Skull className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'pastel':
        return <Palette className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'vintage':
        return <Clock className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'vaporwave':
        return <Computer className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'hacker':
        return <Cpu className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      case 'midnight-aurora ':
        return <SunSnow className="h-[1.2rem] w-[1.2rem] theme-transition"/>
      default:
        return <SunIcon className="h-[1.2rem] w-[1.2rem] theme-transition"/>
    }
  }

  const handleMouseEnter = (newTheme: string) => {
    // Handle the bitmap font used for monospace theme which causes flickring
    if (savedTheme && !monospacedThemes.includes(savedTheme)) {
      if (newTheme && !monospacedThemes.includes(newTheme)) {
        if (previewThemeRef.current === undefined) {
          // Store the current theme before hovering
          previewThemeRef.current = savedTheme;
        }
        setTheme(newTheme);
      }
    }
  };

  const handleMouseLeave = () => {
    if (savedTheme && !monospacedThemes.includes(savedTheme)) {
      setTheme(savedTheme || "light");
      previewThemeRef.current = undefined;
    }
  };

  const handleClick = (newTheme: string) => {
    setSavedTheme(newTheme); 
    setTheme(newTheme);
    previewThemeRef.current = undefined;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative theme-transition">
          <div className="icon-transition">
            {renderIcon()}
          </div>
          <span className="sr-only">toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>light themes</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleClick("light")}
              onMouseEnter={() => handleMouseEnter("light")}
              onMouseLeave={handleMouseLeave}
            >
              light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClick("light-solarized")}
              onMouseEnter={() => handleMouseEnter("light-solarized")}
              onMouseLeave={handleMouseLeave}
            >
              light solarized
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>dark themes</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleClick("dark")}
              onMouseEnter={() => handleMouseEnter("dark")}
              onMouseLeave={handleMouseLeave}
            >
              dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClick("dark-solarized")}
              onMouseEnter={() => handleMouseEnter("dark-solarized")}
              onMouseLeave={handleMouseLeave}
            >
              dark solarized
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>nature</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => handleClick("fall")}
              onMouseEnter={() => handleMouseEnter("fall")}
              onMouseLeave={handleMouseLeave}
            >
              fall
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClick("sunset")}
              onMouseEnter={() => handleMouseEnter("sunset")}
              onMouseLeave={handleMouseLeave}
            >
              sunset
            </DropdownMenuItem>
              <DropdownMenuItem
              onClick={() => handleClick("cherry")}
              onMouseEnter={() => handleMouseEnter("cherry")}
              onMouseLeave={handleMouseLeave}
            >
              cherry
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClick("ocean")}
              onMouseEnter={() => handleMouseEnter("ocean")}
              onMouseLeave={handleMouseLeave}
            >
              ocean
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClick("forest")}
              onMouseEnter={() => handleMouseEnter("forest")}
              onMouseLeave={handleMouseLeave}
            >
              forest
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleClick("midnight-aurora")}
              onMouseEnter={() => handleMouseEnter("midnight-aurora")}
              onMouseLeave={handleMouseLeave}
            >
              midnight aurora
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>stylized</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
            onClick={() => handleClick("cyberpunk")}
            onMouseEnter={() => handleMouseEnter("cyberpunk")}
            onMouseLeave={handleMouseLeave}
            >
              cyberpunk
            </DropdownMenuItem>
            <DropdownMenuItem
            onClick={() => handleClick("gothic")}
            onMouseEnter={() => handleMouseEnter("gothic")}
            onMouseLeave={handleMouseLeave}
            >
              gothic
            </DropdownMenuItem>
            <DropdownMenuItem
            onClick={() => handleClick("pastel")}
            onMouseEnter={() => handleMouseEnter("pastel")}
            onMouseLeave={handleMouseLeave}
            >
              pastel
            </DropdownMenuItem>
            <DropdownMenuItem
            onClick={() => handleClick("vintage")}
            onMouseEnter={() => handleMouseEnter("vintage")}
            onMouseLeave={handleMouseLeave}
            >
              vintage
            </DropdownMenuItem>
            {/* <DropdownMenuItem
            onClick={() => handleClick("vaporwave")}
            onMouseEnter={() => handleMouseEnter("vaporwave")}
            onMouseLeave={handleMouseLeave}
            >
              vaporwave
            </DropdownMenuItem> */}
            <DropdownMenuItem
            onClick={() => handleClick("hacker")}
            onMouseEnter={() => handleMouseEnter("hacker")}
            onMouseLeave={handleMouseLeave}
            >
              hacker
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          onClick={() => handleClick("system")}
          onMouseEnter={() => handleMouseEnter("system")}
          onMouseLeave={handleMouseLeave}
        >
          system
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
