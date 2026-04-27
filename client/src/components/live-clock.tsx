import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = format(time, "EEE d MMM HH.mm.ss", { locale: it });
  
  // Capitalize first letter of the day
  const displayTime = formattedTime.charAt(0).toUpperCase() + formattedTime.slice(1);

  return (
    <div className="ml-4 text-[13px] font-semibold text-slate-700 tracking-tight flex items-center">
      {displayTime}
    </div>
  );
}
