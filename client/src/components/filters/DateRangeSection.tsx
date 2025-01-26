import { DateRangePicker } from "@heroui/react";
import { useDateFormatter } from "@react-aria/i18n";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import type { RangeValue, CalendarDate } from "@heroui/react";

interface DateRangeSectionProps {
  dateRangeValue: RangeValue<CalendarDate> | null;
  onDateRangeChange: (range: RangeValue<CalendarDate> | null) => void;
}

const DateRangeSection = ({
  dateRangeValue,
  onDateRangeChange,
}: DateRangeSectionProps) => {
  const formatter = useDateFormatter({ dateStyle: "long" });
  const maxDate = parseDate(new Date().toISOString().split("T")[0]);

  return (
    <div className="w-full flex flex-col gap-y-2">
      <DateRangePicker
        className="max-w-sm"
        label="Data Date Range"
        minValue={parseDate("2015-01-01")}
        maxValue={maxDate}
        value={dateRangeValue}
        onChange={onDateRangeChange}
      />
      <p className="text-default-500 text-sm">
        Selected date:{" "}
        {dateRangeValue
          ? formatter.formatRange(
              dateRangeValue.start.toDate(getLocalTimeZone()),
              dateRangeValue.end.toDate(getLocalTimeZone()),
            )
          : "--"}
      </p>
    </div>
  );
};

export default DateRangeSection;
