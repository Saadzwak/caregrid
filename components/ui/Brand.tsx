/* eslint-disable @next/next/no-img-element */
export function Brand({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center select-none" style={{ gap: size * 0.3 }}>
      <img src="/caregrid-mark.png" alt="CareGrid" style={{ height: size, width: "auto" }} draggable={false} />
      {withWordmark && (
        <span className="font-display font-bold tracking-tight leading-none" style={{ fontSize: size * 0.82 }}>
          CareGrid
        </span>
      )}
    </span>
  );
}
