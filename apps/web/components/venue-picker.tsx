'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  ExternalLink,
  Loader2,
  Building,
  Check,
  Navigation,
  Sparkles,
  X,
} from 'lucide-react';

interface VenuePickerProps {
  value: string;
  onChange: (location: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface PlaceSuggestion {
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: string;
  lon?: string;
}

const POPULAR_VENUES = [
  { name: 'IIT Delhi, Hauz Khas, New Delhi', type: 'Campus' },
  { name: 'IIT Bombay, Powai, Mumbai', type: 'Campus' },
  { name: 'BITS Pilani, Pilani Campus, Rajasthan', type: 'Campus' },
  { name: 'IIIT Hyderabad, Gachibowli, Hyderabad', type: 'Campus' },
  { name: 'Bangalore International Centre, Domlur, Bengaluru', type: 'Convention' },
  { name: 'India Habitat Centre, Lodhi Road, New Delhi', type: 'Convention' },
];

export function VenuePicker({
  value,
  onChange,
  label = 'Location / Venue *',
  placeholder = 'Search by college, building, landmark, or city...',
  required = true,
}: VenuePickerProps) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [roomDetails, setRoomDetails] = useState('');
  const [showMap, setShowMap] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for locations using OpenStreetMap Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query.trim()
          )}&limit=6&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: PlaceSuggestion[] = data.map((item: any) => ({
            displayName: item.display_name,
            lat: item.lat,
            lon: item.lon,
            city: item.address?.city || item.address?.town || item.address?.state_district,
            state: item.address?.state,
            country: item.address?.country,
          }));
          setSuggestions(mapped);
        }
      } catch {
        // Fallback filter local popular venues
        const localMatches = POPULAR_VENUES.filter((v) =>
          v.name.toLowerCase().includes(query.toLowerCase())
        ).map((v) => ({ displayName: v.name }));
        setSuggestions(localMatches);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (placeName: string) => {
    const finalLocation = roomDetails
      ? `${placeName} (${roomDetails})`
      : placeName;
    setQuery(placeName);
    onChange(finalLocation);
    setShowDropdown(false);
  };

  // Precise Geolocation using Browser GPS
  const handleDetectPreciseLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const fullAddress = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setQuery(fullAddress);
            onChange(fullAddress);
          } else {
            const coordStr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setQuery(coordStr);
            onChange(coordStr);
          }
        } catch {
          const coordStr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setQuery(coordStr);
          onChange(coordStr);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocateError(err.message || 'Unable to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const mapQuery = query.trim() || 'Jaipur, Rajasthan, India';
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapQuery
  )}`;

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Label and GPS Action */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        <button
          type="button"
          onClick={handleDetectPreciseLocation}
          disabled={isLocating}
          className="text-xs font-bold text-[#0099e6] hover:text-[#0284c7] flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5" />
              <span>Set Precise Location</span>
            </>
          )}
        </button>
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={query}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
        />
        <div className="absolute left-3 top-3 pointer-events-none text-slate-400">
          <MapPin className="w-4 h-4 text-[#0099e6]" />
        </div>

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
            }}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            {isLoading && (
              <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0099e6]" />
                <span>Searching places & colleges...</span>
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  Search Results
                </div>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s.displayName)}
                    className="w-full p-2.5 px-3.5 text-left text-xs text-slate-800 hover:bg-sky-50 hover:text-[#0099e6] flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#0099e6]" />
                    <span className="line-clamp-2 leading-relaxed">{s.displayName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Popular College & Tech Venues */}
            {!isLoading && suggestions.length === 0 && (
              <div className="p-3 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#ea580c]" />
                  <span>Popular Campus & Event Venues</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {POPULAR_VENUES.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSuggestion(v.name)}
                      className="text-left p-2 rounded-xl text-xs text-slate-700 hover:bg-sky-50 hover:text-[#0099e6] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{v.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                        {v.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {locateError && (
        <p className="text-[11px] text-red-500 font-medium">{locateError}</p>
      )}

      {/* Hall / Room / Specific Block (Optional) */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
          Hall, Auditorium, or Room Number (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Main Auditorium, 2nd Floor CS Block"
          value={roomDetails}
          onChange={(e) => {
            const detail = e.target.value;
            setRoomDetails(detail);
            const base = query.split(' (')[0];
            if (detail.trim()) {
              onChange(`${base} (${detail.trim()})`);
            } else {
              onChange(base);
            }
          }}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
        />
      </div>

      {/* Google Maps Live Embed Box */}
      {showMap && query && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white animate-in fade-in duration-300">
          <div className="p-2.5 px-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 truncate">
              <Navigation className="w-3.5 h-3.5 text-[#0099e6]" />
              <span className="truncate">{query}</span>
            </div>
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#0099e6] hover:text-[#0284c7] flex items-center gap-1 shrink-0 ml-2 hover:underline"
            >
              <span>Open in Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="w-full h-44 sm:h-52 bg-slate-100 relative">
            <iframe
              title="Venue Google Maps Preview"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
