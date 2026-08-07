// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import type { CSSProperties } from "react";
import { MediaGlobe, MediaStardust } from "@/components/originkit/ui/hero-23/media-globe";
import { ScaleFrame } from "@/components/originkit/ui/hero-23/scale-frame";

const A = "/originkit/hero-23";

const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const NAV_LINKS = [
  { label: "Home", active: true },
  { label: "Pricing", active: false },
  { label: "About", active: false },
  { label: "Tools", active: false },
];

const FLAGS = [
  { src: `${A}/flag-canada.svg`, alt: "Canada" },
  { src: `${A}/flag-sweden.svg`, alt: "Sweden" },
  { src: `${A}/flag-brazil.svg`, alt: "Brazil" },
  { src: `${A}/flag-taiwan.svg`, alt: "Taiwan" },
  { src: `${A}/flag-liberia.svg`, alt: "Liberia" },
  { src: `${A}/flag-ireland.svg`, alt: "Ireland" },
];

const AVATARS = [1, 2, 3];

/** Entrance stagger. `hero-reveal` (globals.css) fades + lifts, and collapses to
 *  a plain fade under prefers-reduced-motion. */
const REVEAL = "animate-hero-reveal";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/** Linearly interpolates a Figma value between two viewport widths, clamped at
 *  both ends — used to grow the tablet frame into the desktop one. */
const interpolate = (from: [number, number], to: [number, number]) => {
  const [fromVw, fromPx] = from;
  const [toVw, toPx] = to;
  const slope = (toPx - fromPx) / (toVw - fromVw);
  const intercept = fromPx - slope * fromVw;
  const sign = intercept < 0 ? "-" : "+";
  const track = `calc(${(slope * 100).toFixed(3)}vw ${sign} ${Math.abs(intercept).toFixed(3)}px)`;
  const [min, max] = fromPx < toPx ? [fromPx, toPx] : [toPx, fromPx];
  return `clamp(${min}px, ${track}, ${max}px)`;
};

/** Tablet → desktop band (744px → 1280px). */
const fluidLg = (atTablet: number, atDesktop: number) =>
  interpolate([744, atTablet], [1280, atDesktop]);

const STARDUST = {
  particleDensity: 10,
  minSize: 1,
  maxSize: 1,
  speed: 10,
  particleSpeed: 1,
  movement: 6,
  angle: 184,
  particleColor: "#FFFFFF33",
  background: "#0F0F0F",
} as const;

const BUTTON_SHADOW =
  "drop-shadow-[0px_53px_7.5px_rgba(0,0,0,0),0px_34px_7px_rgba(0,0,0,0.01),0px_19px_6px_rgba(0,0,0,0.05),0px_9px_4.5px_rgba(0,0,0,0.09),0px_2px_2.5px_rgba(0,0,0,0.1)]";

const BUTTON_GRADIENT =
  "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(90deg, rgb(229, 229, 229) 0%, rgb(229, 229, 229) 100%)";

const LightButton = ({
  label,
  className,
  href,
}: {
  label: string;
  className: string;
  href: string;
}) => (
  <a
    href={href}
    className={`relative flex shrink-0 cursor-pointer items-center justify-center rounded-[3px] transition-opacity duration-200 hover:opacity-80 ${className} ${BUTTON_SHADOW}`}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[3px]"
      style={{ backgroundImage: BUTTON_GRADIENT }}
    />
    <p className="relative shrink-0 whitespace-nowrap text-[16px] leading-normal tracking-[-0.32px] text-[#060e08]">
      {label}
    </p>
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_2px_0px_white,inset_0px_-1.5px_0px_0px_rgba(0,0,0,0.23)]" />
  </a>
);

const DarkButton = ({
  label,
  className,
  href,
}: {
  label: string;
  className: string;
  href: string;
}) => (
  <a
    href={href}
    className={`relative flex shrink-0 cursor-pointer items-center justify-center rounded-[3px] border border-solid border-[rgba(255,255,255,0.1)] bg-[#292929] transition-opacity duration-200 hover:opacity-80 ${className}`}
  >
    <p className="relative shrink-0 whitespace-nowrap text-[16px] leading-normal tracking-[-0.32px] text-white">
      {label}
    </p>
  </a>
);

const Badge = ({ step }: { step: number }) => (
  <div
    style={delay(step)}
    className={`${REVEAL} relative flex shrink-0 items-center justify-center gap-[10px] overflow-clip rounded-[3px] border border-solid border-[rgba(255,255,255,0.1)] bg-[#282828] px-[12px] py-[8px]`}
  >
    <div className="relative size-[6px] shrink-0">
      <img alt="" className="absolute inset-0 block size-full max-w-none" src={`${A}/dot.svg`} />
    </div>
    <p className="relative shrink-0 whitespace-nowrap text-[12px] leading-normal tracking-[-0.24px] text-white">
      $20M raised led by Sequoia Capital
    </p>
  </div>
);

const Corners = ({ size = "size-[10px]" }: { size?: string }) => (
  <>
    <div className={`absolute left-0 top-0 ${size}`}>
      <img alt="" className="block size-full max-w-none" src={`${A}/corner-tl.svg`} />
    </div>
    <div className={`absolute right-0 top-0 flex items-center justify-center ${size}`}>
      <div className="flex-none rotate-180 -scale-y-100">
        <div className={`relative ${size}`}>
          <img alt="" className="block size-full max-w-none" src={`${A}/corner-tr.svg`} />
        </div>
      </div>
    </div>
    <div className={`absolute bottom-0 right-0 flex items-center justify-center ${size}`}>
      <div className="flex-none rotate-180">
        <div className={`relative ${size}`}>
          <img alt="" className="block size-full max-w-none" src={`${A}/corner-tr.svg`} />
        </div>
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 flex items-center justify-center ${size}`}>
      <div className="flex-none -scale-y-100">
        <div className={`relative ${size}`}>
          <img alt="" className="block size-full max-w-none" src={`${A}/corner-tl.svg`} />
        </div>
      </div>
    </div>
  </>
);

/** Every size below is a raw CSS length, so a caller can hand it a fixed px
 *  value (iPad / desktop frames) or a fluid clamp() (phones). */
const StatCard = ({
  className,
  shadow,
  media,
  value,
  caption,
  width,
  padding,
  gap,
  radius,
  border,
  valueSize,
  captionSize,
  tracking,
  position,
}: {
  className: string;
  shadow: string;
  media: React.ReactNode;
  value: string;
  caption: string;
  width: string;
  padding: string;
  gap: string;
  radius: string;
  border: string;
  valueSize: string;
  captionSize: string;
  tracking: string;
  position: CSSProperties;
}) => (
  <div
    className={`${REVEAL} absolute flex flex-col items-center border-solid border-[rgba(255,255,255,0.1)] bg-[#292929] ${className} ${shadow}`}
    style={{
      ...position,
      width,
      padding,
      gap,
      borderRadius: radius,
      borderWidth: border,
    }}
  >
    {media}
    {/* leading 1.15 = Figma's "normal" for Helvetica; keeps the two-line block
        at 36px (mobile) / 50px (desktop) so the card height matches the frame */}
    <div className="relative w-full shrink-0 text-center" style={{ letterSpacing: tracking }}>
      <p
        className="mb-0 font-bold leading-[1.15] text-[rgba(255,255,255,0.8)]"
        style={{ fontSize: valueSize }}
      >
        {value}
      </p>
      <p className="leading-[1.15] text-[rgba(255,255,255,0.6)]" style={{ fontSize: captionSize }}>
        {caption}
      </p>
    </div>
  </div>
);

const Avatars = ({ size, overlap }: { size: string; overlap: string }) => (
  <div className="relative flex shrink-0 items-center">
    {AVATARS.map((n) => (
      <div
        key={n}
        className="relative shrink-0"
        style={{
          width: size,
          height: size,
          marginRight: n < 3 ? `calc(-1 * ${overlap})` : undefined,
        }}
      >
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={`${A}/avatar-${n}.png`}
        />
      </div>
    ))}
  </div>
);

const FlagRow = ({
  size,
  gap,
  maskSize,
  maskPosition,
  offsetX = "0px",
  offsetY = "0px",
}: {
  size: string;
  gap: string;
  maskSize: string;
  maskPosition?: string;
  offsetX?: string;
  offsetY?: string;
}) => (
  <div className="relative inline-grid shrink-0 grid-cols-[max-content] grid-rows-[max-content] place-items-start">
    <div
      className="relative col-start-1 row-start-1 flex items-center"
      style={{
        gap,
        marginLeft: `calc(-1 * ${offsetX})`,
        marginTop: offsetY,
        maskImage: `url("${A}/flags-mask.svg")`,
        WebkitMaskImage: `url("${A}/flags-mask.svg")`,
        maskMode: "alpha",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize,
        WebkitMaskSize: maskSize,
        ...(maskPosition
          ? { maskPosition, WebkitMaskPosition: maskPosition }
          : {}),
      }}
    >
      {FLAGS.map((flag) => (
        <div
          key={flag.alt}
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <img alt={flag.alt} className="absolute inset-0 block size-full max-w-none" src={flag.src} />
        </div>
      ))}
    </div>
  </div>
);

// iPad and desktop share one card size (Figma 2001:35156 / 2001:58408).
const BIG_CARD = {
  className: "overflow-clip",
  padding: "12px",
  gap: "8px",
  radius: "6px",
  border: "1px",
  valueSize: "28px",
  captionSize: "16px",
  tracking: "-0.4px",
} as const;

const BIG_CARD_LEFT = {
  ...BIG_CARD,
  width: "156px",
  value: "300K+",
  caption: "users globally",
  media: <Avatars size="24px" overlap="12px" />,
};

const BIG_CARD_RIGHT = {
  ...BIG_CARD,
  width: "171px",
  value: "120+",
  caption: "countries supported",
  media: <FlagRow size="24px" gap="8px" maskSize="184px 24px" />,
};

const CARD_SHADOW_LEFT_DESKTOP =
  "shadow-[0px_86px_24px_0px_rgba(186,186,186,0),0px_55px_22px_0px_rgba(186,186,186,0.01),0px_31px_19px_0px_rgba(186,186,186,0.05),0px_14px_14px_0px_rgba(186,186,186,0.09),0px_3px_8px_0px_rgba(186,186,186,0.1)]";
const CARD_SHADOW_RIGHT_DESKTOP =
  "shadow-[0px_86px_24px_0px_rgba(186,186,186,0),0px_55px_22px_0px_rgba(186,186,186,0.01),0px_31px_19px_0px_rgba(186,186,186,0.05),0px_14px_14px_0px_rgba(186,186,186,0.09),0px_3px_8px_0px_rgba(186,186,186,0.1)]";
const CARD_SHADOW_LEFT_MOBILE =
  "shadow-[0px_35.467px_9.898px_0px_rgba(186,186,186,0),0px_22.683px_9.073px_0px_rgba(186,186,186,0.01),0px_12.785px_7.836px_0px_rgba(186,186,186,0.05),0px_5.774px_5.774px_0px_rgba(186,186,186,0.09),0px_1.237px_3.299px_0px_rgba(186,186,186,0.1)]";
const CARD_SHADOW_RIGHT_MOBILE =
  "shadow-[0px_35.467px_9.898px_0px_rgba(186,186,186,0),0px_22.683px_9.073px_0px_rgba(186,186,186,0.01),0px_12.785px_7.836px_0px_rgba(186,186,186,0.05),0px_5.774px_5.774px_0px_rgba(186,186,186,0.09),0px_1.237px_3.299px_0px_rgba(186,186,186,0.1)]";

const BRAND_ART = {
  one: (
    <>
      <div className="absolute inset-[10.01%_0.01%_7.49%_24.08%]">
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={`${A}/brand-1-type.svg`}
        />
      </div>
      <div className="absolute inset-[0_78.9%_0_-0.01%]">
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={`${A}/brand-1-mark.svg`}
        />
      </div>
    </>
  ),
  two: (
    <div className="absolute inset-[0_0_-0.01%_0]">
      <img alt="" className="absolute inset-0 block size-full max-w-none" src={`${A}/brand-2.svg`} />
    </div>
  ),
  three: (
    <div className="absolute inset-[-0.02%_0_0.02%_0]">
      <img alt="" className="absolute inset-0 block size-full max-w-none" src={`${A}/brand-3.svg`} />
    </div>
  ),
  four: (
    <div className="absolute inset-[0_-0.01%_0_0.01%]">
      <img alt="" className="absolute inset-0 block size-full max-w-none" src={`${A}/brand-4.svg`} />
    </div>
  ),
} as const;

type BrandCell = { art: keyof typeof BRAND_ART; size: string };

// Logo box sizes are identical on iPad and desktop; only mobile shrinks them.
const BRAND_SIZE = {
  one: "h-[23.741px] w-[130.577px]",
  two: "h-[19.975px] w-[84.396px]",
  three: "h-[34.569px] w-[86.421px]",
  four: "h-[22.045px] w-[97px]",
} as const;

const MOBILE_CELLS: BrandCell[] = [
  { art: "one", size: "h-[17.806px] w-[97.933px]" },
  { art: "two", size: "h-[14.982px] w-[63.297px]" },
  { art: "three", size: "h-[25.926px] w-[64.816px]" },
];

const IPAD_CELLS: BrandCell[] = [
  { art: "one", size: BRAND_SIZE.one },
  { art: "three", size: BRAND_SIZE.three },
  { art: "four", size: BRAND_SIZE.four },
  { art: "two", size: BRAND_SIZE.two },
];

const DESKTOP_CELLS: BrandCell[] = [
  { art: "one", size: BRAND_SIZE.one },
  { art: "two", size: BRAND_SIZE.two },
  { art: "three", size: BRAND_SIZE.three },
  { art: "four", size: BRAND_SIZE.four },
  { art: "two", size: BRAND_SIZE.two },
];

const LogoStrip = ({
  className,
  cells,
  style,
}: {
  className: string;
  cells: BrandCell[];
  style?: CSSProperties;
}) => (
  <div
    className={`${REVEAL} flex items-center border border-solid border-[rgba(255,255,255,0.1)] bg-[#0f0f0f] ${className}`}
    style={style}
  >
    {cells.map((cell, index) => (
      <div
        key={index}
        className={`relative h-full min-w-px flex-[1_0_0] overflow-clip ${
          index < cells.length - 1 ? "border-r border-solid border-[rgba(255,255,255,0.1)]" : ""
        }`}
      >
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-clip ${cell.size}`}
        >
          {BRAND_ART[cell.art]}
        </div>
      </div>
    ))}
    <Corners />
  </div>
);

/* ------------------------------- mobile ------------------------------- */

const MobileLayout = () => (
  // The whole 402px Figma frame is scaled as one unit, so every ratio — line
  // breaks included — matches the design at any phone width while the layout
  // still grows with the screen. Hands over to the tablet frame at 640px,
  // where the scaled type has reached its 56px size.
  <ScaleFrame frameWidth={402} className="w-full overflow-hidden min-[640px]:hidden">
    <div className="flex flex-col items-start gap-[16px] p-[16px]">
    {/* Top Nav */}
    <div
      style={delay(0)}
      className={`${REVEAL} relative flex h-[59px] w-full shrink-0 items-center justify-center gap-[121px] border border-solid border-[rgba(255,255,255,0.1)] bg-[#0f0f0f] px-[32px] py-[15.5px]`}
    >
      <div className="relative flex min-w-px flex-[1_0_0] items-center justify-between">
        <a href="#home" className="relative h-[28px] w-[40px] shrink-0 overflow-clip">
          <img alt="Logo" className="absolute inset-0 block size-full max-w-none" src={`${A}/logo.svg`} />
        </a>
        <div className="relative size-[24px] shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-70">
          <img alt="Menu" className="absolute inset-0 block size-full max-w-none" src={`${A}/menu.svg`} />
        </div>
      </div>
      <Corners />
    </div>

    {/* Hero */}
    <div className="relative h-[628px] w-full shrink-0 overflow-clip border border-solid border-[rgba(255,255,255,0.1)]">
      <div className="absolute inset-0 overflow-clip">
        <div className="pointer-events-none absolute left-[-1px] top-[-3px] h-[631px] w-[372px]">
          <MediaStardust query="(max-width: 639px)" {...STARDUST} />
        </div>
      </div>

      {/* copy — 346 wide, the Figma column; h-304 keeps 41px under the CTAs */}
      <div className="absolute left-[12px] right-[12px] top-[32px] flex h-[304px] flex-col items-center gap-[24px]">
        <div className="relative flex w-full shrink-0 flex-col items-center gap-[12px]">
          <Badge step={80} />
          <div className="relative flex w-full shrink-0 flex-col items-start gap-[8px] text-center text-white">
            <h1 style={delay(160)} className={`${REVEAL} relative w-[340px] max-w-full shrink-0 text-[35px] leading-[40px] tracking-[-1.4px]`}>
              Build Your Global Team. Effortlessly.
            </h1>
            <p
              style={delay(240)}
              className={`${REVEAL} relative w-full shrink-0 text-[14px] leading-[1.5] text-[rgba(255,255,255,0.6)]`}
            >
              Hire exceptional talent across 180+ countries, automate compliance, &amp; manage
              international payroll.
            </p>
          </div>
        </div>
        <div
          style={delay(320)}
          className={`${REVEAL} relative flex w-full shrink-0 flex-col items-start justify-center gap-[16px] overflow-clip`}
        >
          <LightButton label="Get started" href="#start" className="w-full px-[24px] py-[14px]" />
          <DarkButton label="Book a call" href="#book" className="w-full px-[24px] py-[14px]" />
        </div>
      </div>

      {/* globe */}
      <div className="absolute bottom-0 left-0 h-[224px] w-full overflow-clip">
        <div
          style={delay(400)}
          className={`${REVEAL} absolute left-1/2 top-0 h-[371.127px] w-[370.391px] -translate-x-1/2 overflow-clip rounded-[412px]`}
        >
          <MediaGlobe query="(max-width: 639px)" />
        </div>

        <StatCard
          className="overflow-clip"
          shadow={CARD_SHADOW_LEFT_MOBILE}
          position={{ ...delay(480), left: "20.02px", top: "20.41px" }}
          value="300K+"
          caption="users globally"
          width="107.1px"
          padding="8.007px"
          gap="6.006px"
          radius="4.004px"
          border="1.001px"
          valueSize="18.017px"
          captionSize="14.013px"
          tracking="-0.165px"
          media={<Avatars size="20.019px" overlap="4.949px" />}
        />

        <StatCard
          className="overflow-clip"
          shadow={CARD_SHADOW_RIGHT_MOBILE}
          position={{ ...delay(560), right: "12.01px", top: "131.52px" }}
          value="120+"
          caption="countries supported"
          width="143.134px"
          padding="8.007px"
          gap="6.006px"
          radius="4.004px"
          border="0.412px"
          valueSize="18.017px"
          captionSize="14.013px"
          tracking="-0.165px"
          media={
            <FlagRow
              size="20.019px"
              gap="6.006px"
              maskSize="145.137px 21.02px"
              maskPosition="2.76px -1.07px"
              offsetX="2.76px"
              offsetY="1.07px"
            />
          }
        />
      </div>

      <Corners size="size-[9.326px]" />
    </div>

    {/* Logo strip */}
    <LogoStrip
      className="relative h-[80px] w-full shrink-0"
      style={delay(640)}
      cells={MOBILE_CELLS}
    />
    </div>
  </ScaleFrame>
);

/* -------------------------------- iPad -------------------------------- */

const IpadLayout = () => (
  // Figma frame is 744 wide (680 content + 32 gutters); widths stay fluid above
  // that so the same layout carries up to the 1280px desktop breakpoint.
  <div className="hidden flex-col items-start gap-[16px] p-[16px_32px] min-[640px]:flex desktop-sm:hidden">
    {/* Top Nav */}
    <div style={delay(0)} className={`${REVEAL} relative flex h-[59px] w-full shrink-0 items-center justify-center border border-solid border-[rgba(255,255,255,0.1)] bg-[#0f0f0f] px-[32px] py-[15.5px]`}>
      <div className="relative flex min-w-px flex-[1_0_0] items-center justify-between">
        <a href="#home" className="relative h-[28px] w-[40px] shrink-0 overflow-clip">
          <img alt="Logo" className="absolute inset-0 block size-full max-w-none" src={`${A}/logo.svg`} />
        </a>
        <div className="relative size-[24px] shrink-0 cursor-pointer transition-opacity duration-200 hover:opacity-70">
          <img alt="Menu" className="absolute inset-0 block size-full max-w-none" src={`${A}/menu.svg`} />
        </div>
      </div>
      <Corners />
    </div>

    {/* Hero — grows from the 770px tablet frame to the 857px desktop frame */}
    <div
      className="relative w-full shrink-0 overflow-clip border border-solid border-[rgba(255,255,255,0.1)]"
      style={{ height: fluidLg(770, 857) }}
    >
      <div className="absolute inset-0 overflow-clip">
        <div className="pointer-events-none absolute left-[-1px] top-[-1px] h-[calc(100%+90px)] w-[calc(100%+2px)]">
          <MediaStardust query="(min-width: 640px) and (max-width: 1279px)" {...STARDUST} />
        </div>
      </div>

      {/* copy */}
      <div className="absolute left-1/2 top-[48px] flex w-[468px] max-w-[calc(100%-48px)] -translate-x-1/2 flex-col items-center gap-[32px]">
        <div className="relative flex w-full shrink-0 flex-col items-center gap-[24px]">
          <Badge step={80} />
          <div className="relative flex w-full shrink-0 flex-col items-start gap-[16px] text-center text-white">
            <h1 style={delay(160)} className={`${REVEAL} relative w-full shrink-0 text-[56px] leading-[55px] tracking-[-2.24px]`}>
              Build Your Global Team. Effortlessly.
            </h1>
            <p
              style={delay(240)}
              className={`${REVEAL} relative w-full shrink-0 text-[16px] leading-[1.5] text-[rgba(255,255,255,0.6)]`}
            >
              Hire exceptional talent across 180+ countries, automate compliance, and manage
              international payroll.
            </p>
          </div>
        </div>
        <div
          style={delay(320)}
          className={`${REVEAL} relative flex shrink-0 items-center gap-[16px] overflow-clip`}
        >
          <LightButton label="Get started" href="#start" className="px-[24px] py-[14px]" />
          <DarkButton label="Book a call" href="#book" className="px-[24px] py-[14px]" />
        </div>
      </div>

      {/* globe — full content width on a tablet, narrowing toward the desktop
          898/1184 ratio as the viewport grows */}
      <div
        className="absolute bottom-0 left-0 w-full overflow-clip"
        style={{ height: fluidLg(360, 447) }}
      >
        <div
          className={`${REVEAL} absolute left-1/2 top-0 aspect-[680/681.433] -translate-x-1/2 overflow-clip rounded-[999px]`}
          style={{ ...delay(400), width: fluidLg(680, 898), maxWidth: "100%" }}
        >
          <MediaGlobe query="(min-width: 640px) and (max-width: 1279px)" />
        </div>

        <StatCard
          {...BIG_CARD_LEFT}
          position={{ ...delay(480), left: fluidLg(32, 85), top: "8.3%" }}
          shadow={CARD_SHADOW_LEFT_DESKTOP}
        />

        <StatCard
          {...BIG_CARD_RIGHT}
          position={{ ...delay(560), right: fluidLg(32, 51), top: "61.6%" }}
          shadow={CARD_SHADOW_RIGHT_DESKTOP}
        />
      </div>

      <Corners size="size-[9.479px]" />
    </div>

    {/* Logo strip */}
    <LogoStrip
      className="relative h-[95px] w-full shrink-0"
      style={delay(640)}
      cells={IPAD_CELLS}
    />
  </div>
);

/* ------------------------------ desktop ------------------------------- */

const DesktopLayout = () => (
  // Exact at 1280; above that every box keeps its proportion of the content
  // width (1184 = 100vw − 96) so the whole section grows with the screen.
  <div className="hidden w-full flex-col items-start gap-[16px] p-[16px_48px] desktop-sm:flex">
    {/* Top Nav */}
    <div
      style={delay(0)}
      className={`${REVEAL} relative flex w-full items-center justify-center border border-solid border-[rgba(255,255,255,0.1)] bg-[#0f0f0f] px-[32px] py-[16px]`}
    >
      {/* the bar spans the viewport; only its contents are capped, so a 4K
          screen does not spread the logo and CTA to the far corners */}
      <div className="relative mx-auto flex min-w-px max-w-[1600px] flex-[1_0_0] items-center justify-between">
        <a href="#home" className="relative h-[28px] w-[40px] shrink-0 overflow-clip">
          <img alt="Logo" className="absolute inset-0 block size-full max-w-none" src={`${A}/logo.svg`} />
        </a>
        <LightButton label="Get started" href="#start" className="px-[16px] py-[12px]" />
        <div className="absolute left-1/2 top-[calc(50%-0.5px)] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[24px] whitespace-nowrap text-[16px] leading-normal text-white">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={`#${link.label.toLowerCase()}`}
              className={`relative shrink-0 cursor-pointer transition-opacity duration-200 ${
                link.active ? "hover:opacity-80" : "opacity-60 hover:opacity-100"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <Corners />
    </div>

    {/* Hero — 857 / 1184 of the content width, capped so ultrawides stay sane */}
    <div
      className="relative w-full shrink-0 overflow-clip border border-solid border-[rgba(255,255,255,0.1)]"
      style={{ height: "clamp(857px, calc(72.38vw - 69.5px), 1100px)" }}
    >
      <div className="absolute inset-0 overflow-clip">
        <div className="pointer-events-none absolute left-[-75px] top-[-3px] h-[calc(100%+6px)] w-[calc(100%+150px)]">
          <MediaStardust query="(min-width: 1280px)" {...STARDUST} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0">
        <img alt="" className="absolute inset-0 block size-full max-w-none" src={`${A}/corners.svg`} />
      </div>

      {/* copy */}
      <div className="absolute left-1/2 top-[48px] flex w-[468px] -translate-x-1/2 flex-col items-center gap-[32px]">
        <div className="relative flex w-full shrink-0 flex-col items-center gap-[24px]">
          <Badge step={80} />
          <div className="relative flex w-full shrink-0 flex-col items-start gap-[16px] text-center text-white">
            <h1 style={delay(160)} className={`${REVEAL} relative w-full shrink-0 text-[56px] leading-[64px] tracking-[-2.24px]`}>
              Build Your Global Team. Effortlessly.
            </h1>
            <p
              style={delay(240)}
              className={`${REVEAL} relative w-full shrink-0 text-[16px] leading-[1.5] text-[rgba(255,255,255,0.6)]`}
            >
              Hire exceptional talent across 180+ countries, automate compliance, and manage
              international payroll.
            </p>
          </div>
        </div>
        <div
          style={delay(320)}
          className={`${REVEAL} relative flex shrink-0 items-center gap-[16px] overflow-clip`}
        >
          <LightButton label="Get started" href="#start" className="px-[24px] py-[14px]" />
          <DarkButton label="Book a call" href="#book" className="px-[24px] py-[14px]" />
        </div>
      </div>

      {/* globe — 898 / 1184 wide, frame 447 tall (49.78% of its own width) */}
      <div className="absolute bottom-0 left-1/2 aspect-[898/447] w-[75.84%] -translate-x-1/2 overflow-clip full-hd:w-[62%] ultrawide:w-[54%]">
        <div
          style={delay(400)}
          className={`${REVEAL} absolute left-1/2 top-0 aspect-[898/900] w-full -translate-x-1/2 overflow-clip rounded-[999px]`}
        >
          <MediaGlobe query="(min-width: 1280px)" />
        </div>

        <StatCard
          {...BIG_CARD_LEFT}
          position={{ ...delay(480), left: "9.47%", top: "7.38%" }}
          shadow={CARD_SHADOW_LEFT_DESKTOP}
        />

        <StatCard
          {...BIG_CARD_RIGHT}
          position={{ ...delay(560), right: "5.68%", top: "61.52%" }}
          shadow={CARD_SHADOW_RIGHT_DESKTOP}
        />
      </div>
    </div>

    {/* Logo strip */}
    <LogoStrip
      className="relative h-[95px] w-full shrink-0"
      style={delay(640)}
      cells={DESKTOP_CELLS}
    />
  </div>
);

export const Sec1Hero = () => (
  <main className="w-full bg-[#181818]" style={{ fontFamily: HELVETICA }}>
    <MobileLayout />
    <IpadLayout />
    <DesktopLayout />
  </main>
);
