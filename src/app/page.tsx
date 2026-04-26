"use client";

import { useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { CalendarDays } from "lucide-react";
import { blockedRanges, nightlyPrice } from "@/data/mockData";
import { supabase } from "@/lib/supabaseClient";

function isBlockedDate(date: Date) {
  return blockedRanges.some((range) => {
    const from = parseISO(range.from);
    const to = parseISO(range.to);
    return isWithinInterval(date, { start: from, end: to });
  });
}

function isIntervalAvailable(from: Date, to: Date) {
  const allDays = eachDayOfInterval({ start: from, end: to });
  return allDays.every((day) => !isBlockedDate(day));
}

export default function HomePage() {
  const today = startOfDay(new Date());
  const yearNow = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(yearNow);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [propertyName, setPropertyName] = useState("Pensjonat Blekitny Brzeg");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  const visibleMonth = new Date(selectedYear, selectedMonth, 1);
  const monthStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
  const monthEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nights = useMemo(() => {
    if (!fromDate || !toDate) {
      return 0;
    }
    return differenceInCalendarDays(toDate, fromDate) + 1;
  }, [fromDate, toDate]);

  const totalPrice = nights > 0 ? nights * nightlyPrice : 0;

  async function addBooking() {
    if (!fromDate || !toDate) {
      return;
    }

    const { error } = await supabase.from("bookings").insert({
      property_name: propertyName,
      check_in: format(fromDate, "yyyy-MM-dd"),
      check_out: format(toDate, "yyyy-MM-dd"),
      guest_name: guestName,
      guest_email: guestEmail,
      total_price: totalPrice
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  function handleDayClick(day: Date) {
    setFeedback(null);

    if (isBefore(day, today) || isBlockedDate(day)) {
      return;
    }

    if (!fromDate || toDate) {
      setFromDate(day);
      setToDate(null);
      return;
    }

    if (isBefore(day, fromDate)) {
      setFromDate(day);
      return;
    }

    if (!isIntervalAvailable(fromDate, day)) {
      setFeedback("Wybrany zakres zawiera zajete dni. Wybierz inny termin.");
      return;
    }

    setToDate(day);
  }

  async function handleBookingSubmit() {
    setFeedback(null);

    if (!guestName || !guestEmail || !propertyName || !fromDate || !toDate) {
      setFeedback("Uzupelnij dane i wybierz daty pobytu.");
      return;
    }

    if (!isIntervalAvailable(fromDate, toDate)) {
      setFeedback("Wybrany termin jest niedostepny.");
      return;
    }

    try {
      setIsSavingBooking(true);
      await addBooking();
      setFeedback("Rezerwacja zapisana w bazie!");
      setGuestName("");
      setGuestEmail("");
      setFromDate(null);
      setToDate(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany blad zapisu.";
      setFeedback(`Blad zapisu do bazy: ${message}`);
    } finally {
      setIsSavingBooking(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
          <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">Rezerwacja noclegu</h1>
          <p className="mt-1 text-sm text-slate-500">Publiczna strona klienta. Panel właściciela jest dostępny pod /admin.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
            <div className="mb-4 flex items-center gap-2 text-brand-700">
              <CalendarDays size={18} />
              <h2 className="text-lg font-semibold">Wybierz termin pobytu</h2>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                {[
                  "Styczen",
                  "Luty",
                  "Marzec",
                  "Kwiecien",
                  "Maj",
                  "Czerwiec",
                  "Lipiec",
                  "Sierpien",
                  "Wrzesien",
                  "Pazdziernik",
                  "Listopad",
                  "Grudzien"
                ].map((monthLabel, idx) => (
                  <option key={monthLabel} value={idx}>
                    {monthLabel}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                {Array.from({ length: 7 }).map((_, idx) => {
                  const year = yearNow - 1 + idx;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
              {["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Niedz"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const blocked = isBlockedDate(day);
                const past = isBefore(day, today);
                const outOfMonth = day.getMonth() !== selectedMonth;
                const selectedFrom = fromDate && format(day, "yyyy-MM-dd") === format(fromDate, "yyyy-MM-dd");
                const selectedTo = toDate && format(day, "yyyy-MM-dd") === format(toDate, "yyyy-MM-dd");
                const inSelectedRange = fromDate && toDate && isWithinInterval(day, { start: fromDate, end: toDate });

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`h-12 rounded-xl text-sm transition ${
                      outOfMonth
                        ? "bg-slate-50 text-slate-300"
                        : past
                          ? "cursor-not-allowed bg-slate-100 text-slate-300"
                          : blocked
                            ? "cursor-not-allowed bg-rose-100 text-rose-500"
                            : selectedFrom || selectedTo
                              ? "bg-brand-600 font-semibold text-white"
                              : inSelectedRange
                                ? "bg-brand-100 text-brand-700"
                                : "bg-slate-100 text-slate-700 hover:bg-brand-50"
                    }`}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-500">Nowe rezerwacje nie blokuja lokalnie kalendarza. Zajete sa tylko terminy mock.</p>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
            <h3 className="text-lg font-semibold text-brand-900">Podsumowanie</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Data od</dt>
                <dd className="font-medium">{fromDate ? format(fromDate, "dd.MM.yyyy") : "-"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Data do</dt>
                <dd className="font-medium">{toDate ? format(toDate, "dd.MM.yyyy") : "-"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Liczba nocy</dt>
                <dd className="font-medium">{nights || "-"}</dd>
              </div>
              <div className="mt-2 rounded-xl bg-brand-50 p-3">
                <dt className="text-xs uppercase tracking-wide text-brand-700">Cena laczna</dt>
                <dd className="mt-1 text-2xl font-semibold text-brand-900">{totalPrice ? `${totalPrice} zl` : "-"}</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-3">
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Nazwa obiektu"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Twoje imie i nazwisko"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Twoj e-mail"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleBookingSubmit}
                disabled={isSavingBooking}
                className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingBooking ? "Zapisywanie..." : "Zarezerwuj termin"}
              </button>
            </div>

            {feedback && <p className="mt-3 text-sm text-brand-700">{feedback}</p>}
          </aside>
        </section>
      </div>
    </main>
  );
}
