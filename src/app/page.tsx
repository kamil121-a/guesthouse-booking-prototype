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
import { CalendarDays, Car, Coffee, Mountain, Wifi } from "lucide-react";
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-100/40 ring-1 ring-slate-200">
          <div className="relative h-[300px] w-full md:h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
              alt="Nowoczesny apartament"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 p-6 md:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-100">Apartament premium</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-5xl">Blekitny Brzeg</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
                Eleganckie miejsce na odpoczynek blisko natury, z nowoczesnym wnetrzem i spokojna atmosfera.
              </p>
            </div>
          </div>
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="space-y-6 rounded-3xl bg-white p-6 shadow-md shadow-slate-200/60 ring-1 ring-slate-200 md:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Twoja nowoczesna wizytowka apartamentu</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Apartament Blekitny Brzeg laczy minimalistyczny design i funkcjonalnosc. To idealny wybor na weekendowy
                wyjazd lub dluzszy pobyt dla par i osob pracujacych zdalnie.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Udogodnienia</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Wifi className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Szybkie Wi-Fi</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Coffee className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Ekspres do kawy</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Car className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Prywatny parking</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Mountain className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Widok na nature</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="rounded-3xl bg-white p-6 shadow-lg shadow-brand-100/40 ring-1 ring-slate-200 md:p-7">
            <div className="mb-5 flex items-center gap-2 text-brand-700">
              <CalendarDays size={18} />
              <h2 className="text-xl font-semibold text-slate-900">Booking Card</h2>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
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
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
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

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
              {["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Niedz"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
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
                    className={`h-9 rounded-lg text-xs transition ${
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

            <div className="mt-5 space-y-2 rounded-2xl bg-brand-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Od</span>
                <span className="font-medium text-slate-800">{fromDate ? format(fromDate, "dd.MM.yyyy") : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Do</span>
                <span className="font-medium text-slate-800">{toDate ? format(toDate, "dd.MM.yyyy") : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Noce</span>
                <span className="font-medium text-slate-800">{nights || "-"}</span>
              </div>
              <div className="border-t border-brand-200 pt-2">
                <p className="text-xs uppercase tracking-wide text-brand-700">Cena laczna</p>
                <p className="text-2xl font-semibold text-brand-900">{totalPrice ? `${totalPrice} zl` : "-"}</p>
              </div>
            </div>

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
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingBooking ? "Zapisywanie..." : "Zarezerwuj teraz"}
              </button>
            </div>

            {feedback && <p className="mt-3 text-sm text-brand-700">{feedback}</p>}
          </aside>
        </section>
      </div>
    </main>
  );
}
