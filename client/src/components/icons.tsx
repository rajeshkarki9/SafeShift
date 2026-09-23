import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...rest,
  };
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12H5" />
      <path d="m10.5 6-6 6 6 6" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.8 12C5.4 7.6 8.7 5.4 12 5.4S18.6 7.6 21.2 12c-2.6 4.4-5.9 6.6-9.2 6.6S5.4 16.4 2.8 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4.5 20 19.5" />
      <path d="M9.9 6c.7-.2 1.4-.3 2.1-.3 3.3 0 6.6 2.2 9.2 6.3-.7 1.2-1.5 2.2-2.3 3.1M6.2 7.6C4.9 8.7 3.8 10.2 2.8 12c2.6 4.4 5.9 6.6 9.2 6.6 1.1 0 2.2-.2 3.2-.7" />
      <path d="M10.2 10.3a2.6 2.6 0 0 0 3.6 3.6" />
    </svg>
  );
}

export function IconLogOut(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4H5v16h7" />
      <path d="M10 12h11" />
      <path d="m17 8 4 4-4 4" />
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v8H3Z" />
      <path d="M14 3h4.5A2.5 2.5 0 0 1 21 5.5V8h-7Z" />
      <path d="M14 11h7v7.5a2.5 2.5 0 0 1-2.5 2.5H14Z" />
      <path d="M3 14h8v7H5.5A2.5 2.5 0 0 1 3 18.5Z" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.4 19.5c.6-3.4 2.9-5.3 5.6-5.3s5 1.9 5.6 5.3" />
      <path d="M15.4 5.2a3.25 3.25 0 0 1 0 5.7" />
      <path d="M17.6 14.7c1.7.8 2.8 2.4 3.1 4.8" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="7.8" r="3.4" />
      <path d="M5.4 20c.7-3.9 3.3-6 6.6-6s5.9 2.1 6.6 6" />
    </svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19.6 6.2A9 9 0 1 0 21 12" />
      <path d="m8.4 12.2 2.6 2.6 8.2-9" />
    </svg>
  );
}

export function IconCircleDashed(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.6" strokeDasharray="4.1 4.4" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.2v4.8l3.1 1.9" />
    </svg>
  );
}

export function IconTrendUp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 17 6-6 4 4 8-8.5" />
      <path d="M15.5 6.5H21V12" />
    </svg>
  );
}

export function IconActivity(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12.5h3.4l2.8-6.5 3.9 12 2.7-5.5H21" />
    </svg>
  );
}

export function IconListChecks(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3.4 6.4 1.8 1.8 3.4-3.6" />
      <path d="M12.5 6.5H21" />
      <path d="m3.4 14.9 1.8 1.8 3.4-3.6" />
      <path d="M12.5 15H21" />
      <path d="M12.5 19.5H17" />
    </svg>
  );
}

export function IconBookOpen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.6C10 4.9 7.3 4.1 3.5 4.1v14.3c3.8 0 6.5.8 8.5 2.5 2-1.7 4.7-2.5 8.5-2.5V4.1c-3.8 0-6.5.8-8.5 2.5Z" />
      <path d="M12 6.6v14.3" />
    </svg>
  );
}

export function IconUserPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="7.8" r="3.4" />
      <path d="M3.8 20c.7-3.8 3.1-5.9 6.2-5.9 1.5 0 2.8.4 3.9 1.3" />
      <path d="M18.5 13.5v6" />
      <path d="M15.5 16.5h6" />
    </svg>
  );
}

export function IconKeyRound(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="7.8" cy="16.2" r="3.8" />
      <path d="m10.6 13.4 9.2-9.2" />
      <path d="m16.6 7.4 2.8 2.8" />
    </svg>
  );
}
