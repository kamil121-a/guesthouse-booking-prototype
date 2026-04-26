"use client";

import { useEffect, useMemo, useState } from "react";
import { eachDayOfInterval, endOfMonth, format, isAfter, isSameDay, max, min, parseISO, startOfDay, startOfMonth } from "date-fns";
import { CalendarRange, CircleDollarSign, Grid2x2, LogIn, LogOut, Settings, Tag, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type BookingRow = {
  id: string;
  created_at: string;
  property_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  total_price: number;
};

type BookingWithStatus = BookingRow & {
  status: "Opłacone" | "Oczekuje";
};

export function AdminDashboard() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const bookingsWithStatus = useMemo<BookingWithStatus[]>(() => {
    return bookings.map((booking) => {
      const checkInDate = parseISO(booking.check_in);
      const status: BookingWithStatus["status"] = isAfter(checkInDate, today) ? "Oczekuje" : "Opłacone";
      return { ...booking, status };
    });
  }, [bookings, today]);

  const paidMonthRevenue = useMemo(() => {
    return bookingsWithStatus
      .filter((booking) => {
        const checkInDate = parseISO(booking.check_in);
        return booking.status === "Opłacone" && checkInDate >= monthStart && checkInDate <= monthEnd;
      })
      .reduce((sum, booking) => sum + Number(booking.total_price ?? 0), 0);
  }, [bookingsWithStatus, monthStart, monthEnd]);

  const activeReservations = useMemo(() => {
    return bookingsWithStatus.filter((booking) => isAfter(parseISO(booking.check_in), today)).length;
  }, [bookingsWithStatus, today]);

  const occupancyPercent = useMemo(() => {
    const occupiedDays = new Set<string>();

    bookingsWithStatus.forEach((booking) => {
      const bookingStart = parseISO(booking.check_in);
      const bookingEnd = parseISO(booking.check_out);

      if (bookingEnd < monthStart || bookingStart > monthEnd) {
        return;
      }

      const overlapStart = max([bookingStart, monthStart]);
      const overlapEnd = min([bookingEnd, monthEnd]);
      eachDayOfInterval({ start: overlapStart, end: overlapEnd }).forEach((day) => {
        occupiedDays.add(format(day, "yyyy-MM-dd"));
      });
    });

    const totalMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
    if (totalMonthDays === 0) {
      return 0;
    }
    return Math.round((occupiedDays.size / totalMonthDays) * 100);
  }, [bookingsWithStatus, monthStart, monthEnd]);

  const todayCheckIns = useMemo(() => {
    return bookingsWithStatus.filter((booking) => isSameDay(parseISO(booking.check_in), today));
  }, [bookingsWithStatus, today]);

  const todayCheckOuts = useMemo(() => {
    return bookingsWithStatus.filter((booking) => isSameDay(parseISO(booking.check_out), today));
  }, [bookingsWithStatus, today]);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("bookings")
        .select("id, created_at, property_name, check_in, check_out, guest_name, guest_email, total_price")
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setBookings((data as BookingRow[]) ?? []);
      setLoading(false);
    }

    void loadBookings();
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  function statusBadge(status: BookingWithStatus["status"]) {
    if (status === "Opłacone") {
      return "bg-emerald-100 text-emerald-700";
    }
    return "bg-amber-100 text-amber-700";
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Dashboard zarządczy</h1>
              <p className="mt-1 text-sm text-slate-500">Przegląd operacji i rezerwacji z tabeli bookings (Supabase).</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </header>

        <nav className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <ul className="flex flex-wrap gap-2">
            <li className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
              <Grid2x2 size={16} />
              Dashboard
            </li>
            <li className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <CalendarRange size={16} />
              Kalendarz (Szachownica)
            </li>
            <li className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <Tag size={16} />
              Cennik
            </li>
            <li className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <Settings size={16} />
              Ustawienia iCal
            </li>
          </ul>
        </nav>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Przychód (Bieżący miesiąc)</p>
            <div className="mt-2 flex items-center gap-2 text-brand-800">
              <Wallet size={18} />
              <p className="text-2xl font-semibold">{paidMonthRevenue.toFixed(2)} zł</p>
            </div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Obłożenie</p>
            <div className="mt-2 flex items-center gap-2 text-brand-800">
              <CircleDollarSign size={18} />
              <p className="text-2xl font-semibold">{occupancyPercent}%</p>
            </div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Aktywne Rezerwacje</p>
            <div className="mt-2 flex items-center gap-2 text-brand-800">
              <CalendarRange size={18} />
              <p className="text-2xl font-semibold">{activeReservations}</p>
            </div>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Dzisiejsze operacje</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <LogIn size={16} className="text-emerald-600" />
                Check-in dzisiaj
              </p>
              {todayCheckIns.length === 0 ? (
                <p className="text-sm text-slate-500">Brak zaplanowanych check-in.</p>
              ) : (
                <ul className="space-y-2">
                  {todayCheckIns.map((booking) => (
                    <li key={`in-${booking.id}`} className="text-sm text-slate-700">
                      {booking.guest_name} ({booking.property_name})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <LogOut size={16} className="text-rose-600" />
                Check-out dzisiaj
              </p>
              {todayCheckOuts.length === 0 ? (
                <p className="text-sm text-slate-500">Brak zaplanowanych check-out.</p>
              ) : (
                <ul className="space-y-2">
                  {todayCheckOuts.map((booking) => (
                    <li key={`out-${booking.id}`} className="text-sm text-slate-700">
                      {booking.guest_name} ({booking.property_name})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Rezerwacje</h2>
          {loading && <p className="text-sm text-slate-500">Ladowanie danych...</p>}
          {error && <p className="text-sm text-rose-600">Blad pobierania: {error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Gość</th>
                    <th className="px-3 py-2">Termin</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsWithStatus.map((booking) => (
                    <tr key={booking.id} className="rounded-xl bg-slate-50">
                      <td className="rounded-l-xl px-3 py-3">
                        <div className="font-medium">{booking.guest_name}</div>
                        <div className="text-xs text-slate-500">{booking.guest_email}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {format(parseISO(booking.check_in), "dd.MM.yyyy")} -{" "}
                        {format(parseISO(booking.check_out), "dd.MM.yyyy")}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="rounded-r-xl px-3 py-3 font-medium text-brand-800">{Number(booking.total_price).toFixed(2)} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
