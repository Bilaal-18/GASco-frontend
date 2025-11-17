import React from "react";
import { Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";

export const ChartContainer = React.forwardRef(function ChartContainer(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});

export const ChartTooltip = ({ content, cursor, ...props }) => {
  return (
    <RechartsTooltip
      cursor={cursor ?? { fill: "transparent" }}
      {...props}
      content={(tooltipProps) => {
        if (React.isValidElement(content)) {
          return React.cloneElement(content, tooltipProps);
        }
        return <ChartTooltipContent {...tooltipProps} />;
      }}
    />
  );
};

export const ChartTooltipContent = ({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  className,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const title = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3 text-sm shadow-sm",
        className
      )}
    >
      {title && <div className="font-medium">{title}</div>}
      <div className="mt-2 grid gap-1">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-muted-foreground">
              {item.name ?? item.dataKey}
            </span>
            <span className="font-semibold">
              {valueFormatter ? valueFormatter(item.value, item) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

