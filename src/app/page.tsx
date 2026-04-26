"use client";

import "react-day-picker/style.css";
import { useEffect, useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  startOfDay
} from "date-fns";
import type { DateRange, Matcher } from "react-day-picker";
import { DayPicker } from "react-day-picker";
import { CalendarDays, Car, Tv, UtensilsCrossed, Wifi } from "lucide-react";
import { blockedRanges, nightlyPrice } from "@/data/mockData";
import { supabase } from "@/lib/supabaseClient";

type BookingDateRow = {
  check_in: string;
  check_out: string;
};

export default function HomePage() {
  const today = startOfDay(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [propertyName, setPropertyName] = useState("Pensjonat Blekitny Brzeg");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [blockedFromDb, setBlockedFromDb] = useState<Date[]>([]);

  const fromDate = selectedRange?.from;
  const toDate = selectedRange?.to;

  const blockedFromMock = useMemo(() => {
    return blockedRanges.flatMap((range) =>
      eachDayOfInterval({ start: parseISO(range.from), end: parseISO(range.to) }).map((day) => startOfDay(day))
    );
  }, []);

  useEffect(() => {
    async function fetchBlockedDates() {
      const { data, error } = await supabase.from("bookings").select("check_in, check_out");

      if (error || !data) {
        return;
      }

      const mapped = (data as BookingDateRow[]).flatMap((row) => {
        const start = parseISO(row.check_in);
        const end = parseISO(row.check_out);
        return eachDayOfInterval({ start, end }).map((day) => startOfDay(day));
      });

      setBlockedFromDb(mapped);
    }

    void fetchBlockedDates();
  }, []);

  const blockedDates = useMemo(() => {
    const merged = [...blockedFromMock, ...blockedFromDb];
    return merged.filter((date, idx) => merged.findIndex((other) => isSameDay(other, date)) === idx);
  }, [blockedFromMock, blockedFromDb]);

  function isIntervalAvailable(from: Date, to: Date) {
    const allDays = eachDayOfInterval({ start: from, end: to });
    return allDays.every((day) => !blockedDates.some((blockedDate) => isSameDay(blockedDate, day)));
  }

  const disabledDays: Matcher[] = [{ before: today }, ...blockedDates];

  const nights = useMemo(() => {
    if (!fromDate || !toDate || isSameDay(fromDate, toDate)) {
      return 0;
    }
    return differenceInCalendarDays(toDate, fromDate);
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
      setSelectedRange(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany blad zapisu.";
      setFeedback(`Blad zapisu do bazy: ${message}`);
    } finally {
      setIsSavingBooking(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-24 md:p-8 md:pb-8">
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Wifi className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Szybkie Wi-Fi</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Car className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Prywatny parking</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <UtensilsCrossed className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">W pelni wyposazona kuchnia</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <Tv className="text-brand-600" size={20} />
                  <span className="text-sm font-medium text-slate-700">Smart TV 55"</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="rounded-3xl bg-white p-6 shadow-lg shadow-brand-100/40 ring-1 ring-slate-200 md:p-7">
            <div className="mb-5 flex items-center gap-2 text-brand-700">
              <CalendarDays size={18} />
              <h2 className="text-xl font-semibold text-slate-900">Booking Card</h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={setSelectedRange}
                disabled={disabledDays}
                numberOfMonths={1}
                weekStartsOn={1}
                className="text-sm"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-2",
                  caption: "flex items-center justify-between px-1 pt-1",
                  caption_label: "text-sm font-semibold text-slate-800",
                  nav: "flex items-center gap-1",
                  button_previous: "rounded-lg border border-slate-200 p-1 hover:bg-slate-100",
                  button_next: "rounded-lg border border-slate-200 p-1 hover:bg-slate-100",
                  table: "w-full border-collapse",
                  weekdays: "grid grid-cols-7 gap-1 mt-2",
                  weekday: "text-center text-[11px] font-medium text-slate-500",
                  week: "grid grid-cols-7 gap-1 mt-1",
                  day: "h-9 w-full rounded-lg text-xs",
                  day_button: "h-9 w-full rounded-lg hover:bg-brand-50",
                  selected: "bg-brand-600 text-white hover:bg-brand-600",
                  range_middle: "bg-brand-100 text-brand-700",
                  today: "border border-brand-300",
                  disabled: "text-slate-300 line-through"
                }}
              />
            </div>

            <div className="mt-5 space-y-2 rounded-2xl bg-brand-50 p-4">
              <p className="text-xs uppercase tracking-wide text-brand-700">Podsumowanie pobytu</p>
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
                className="hidden w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 md:block"
              >
                {isSavingBooking ? "Zapisywanie..." : "Zarezerwuj teraz"}
              </button>
            </div>

            {feedback && <p className="mt-3 text-sm text-brand-700">{feedback}</p>}
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">{nights > 0 ? `${nights} nocy` : "Wybierz termin"}</p>
            <p className="text-lg font-semibold text-brand-900">{totalPrice ? `${totalPrice} zl` : "-"}</p>
          </div>
          <button
            type="button"
            onClick={handleBookingSubmit}
            disabled={isSavingBooking}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSavingBooking ? "Zapisywanie..." : "Zarezerwuj teraz"}
          </button>
        </div>
      </div>
    </main>
  );
}
