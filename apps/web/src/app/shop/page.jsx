"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

const TYPE_LABELS = {
  theme: "🎨 Board Themes",
  frame: "🖼️ Profile Frames",
  animation: "✨ Victory Effects",
};
const TYPE_ICONS = { theme: "🎨", frame: "🖼️", animation: "✨" };

export default function ShopPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [cosmetics, setCosmetics] = useState({});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("theme");
  const [processing, setProcessing] = useState({});
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) {
      fetchData();
    }
  }, [user, userLoading]);

  const fetchData = async () => {
    try {
      const [cosRes, profileRes] = await Promise.all([
        fetch("/api/cosmetics"),
        fetch(`/api/profiles/${user.id}`),
      ]);
      if (cosRes.ok) {
        const d = await cosRes.json();
        setCosmetics(d.grouped || {});
      }
      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.profile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (cosmeticId) => {
    setProcessing((prev) => ({ ...prev, [cosmeticId]: true }));
    setError(null);
    try {
      const res = await fetch("/api/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purchase", cosmeticId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing((prev) => ({ ...prev, [cosmeticId]: false }));
    }
  };

  const handleEquip = async (cosmeticId) => {
    setProcessing((prev) => ({ ...prev, [cosmeticId]: true }));
    try {
      const res = await fetch("/api/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "equip", cosmeticId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess("Equipped!");
      fetchData();
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing((prev) => ({ ...prev, [cosmeticId]: false }));
    }
  };

  const currentItems = cosmetics[activeType] || [];

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div
          className="w-10 h-10 border-4 border-[#6D28D9] border-t-transparent rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
        ></div>
        <style
          jsx
          global
        >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="shop" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">Shop</h1>
            <p className="text-gray-400 text-sm mt-1">
              Unlock premium cosmetics for your profile
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5">
              <span className="text-[#F59E0B]">🪙</span>
              <span className="text-white font-semibold">
                {profile.coins.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">coins</span>
            </div>
          )}
        </div>

        {success && (
          <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg text-sm text-[#22C55E]">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Type Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {Object.keys(TYPE_LABELS).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeType === type
                  ? "bg-[#6D28D9] text-white"
                  : "bg-[#111827] border border-[#E5E7EB]/10 text-gray-400 hover:text-white"
              }`}
            >
              {TYPE_ICONS[type]}{" "}
              {TYPE_LABELS[type].split(" ").slice(1).join(" ")}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className={`bg-[#111827] border rounded-2xl overflow-hidden transition-all hover:scale-[1.02] ${
                item.is_equipped
                  ? "border-[#22C55E]/40"
                  : item.owned
                    ? "border-[#6D28D9]/30"
                    : "border-[#E5E7EB]/10"
              }`}
            >
              {/* Preview */}
              <div
                className={`h-32 flex items-center justify-center relative ${
                  activeType === "theme" && item.config
                    ? ""
                    : "bg-gradient-to-br from-[#1F2937] to-[#111827]"
                }`}
                style={
                  activeType === "theme" && item.config
                    ? { backgroundColor: item.config.bg }
                    : {}
                }
              >
                {activeType === "theme" && item.config && (
                  <div className="grid grid-cols-3 gap-1 p-4">
                    {["X", null, "O", null, "X", null, "O", null, "X"].map(
                      (cell, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: item.config.cell }}
                        >
                          {cell === "X" && (
                            <span style={{ color: item.config.x_color }}>
                              X
                            </span>
                          )}
                          {cell === "O" && (
                            <span style={{ color: item.config.o_color }}>
                              O
                            </span>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
                {activeType === "frame" && item.config && (
                  <div
                    className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: item.config.color }}
                  >
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                {activeType === "animation" && (
                  <div className="text-4xl">
                    {item.name.includes("Explosion")
                      ? "💥"
                      : item.name.includes("Galaxy")
                        ? "🌌"
                        : item.name.includes("Rainbow")
                          ? "🌈"
                          : "🎊"}
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {item.is_equipped && (
                    <span className="text-[10px] bg-[#22C55E] text-white px-2 py-0.5 rounded-full font-medium">
                      Equipped
                    </span>
                  )}
                  {item.owned && !item.is_equipped && (
                    <span className="text-[10px] bg-[#6D28D9] text-white px-2 py-0.5 rounded-full font-medium">
                      Owned
                    </span>
                  )}
                  {item.price === 0 && !item.owned && (
                    <span className="text-[10px] bg-[#22C55E] text-white px-2 py-0.5 rounded-full font-medium">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    {item.price === 0 ? (
                      <span className="text-[#22C55E] text-sm font-medium">
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="text-[#F59E0B]">🪙</span>
                        <span className="text-white font-semibold">
                          {item.price.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {item.owned ? (
                  <button
                    onClick={() => !item.is_equipped && handleEquip(item.id)}
                    disabled={item.is_equipped || processing[item.id]}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      item.is_equipped
                        ? "bg-[#22C55E]/10 text-[#22C55E] cursor-default"
                        : "bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
                    }`}
                  >
                    {item.is_equipped
                      ? "✓ Equipped"
                      : processing[item.id]
                        ? "Equipping..."
                        : "Equip"}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item.id)}
                    disabled={
                      processing[item.id] ||
                      (profile && profile.coins < item.price)
                    }
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      profile && profile.coins < item.price
                        ? "bg-[#1F2937] text-gray-500 cursor-not-allowed"
                        : "bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
                    }`}
                  >
                    {processing[item.id]
                      ? "Purchasing..."
                      : profile && profile.coins < item.price
                        ? "Not enough coins"
                        : item.price === 0
                          ? "Get Free"
                          : "Purchase"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {currentItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-gray-400">No items in this category</p>
          </div>
        )}

        {/* How to earn coins */}
        <div className="mt-12 bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            How to Earn Coins
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🏆", label: "Win Matches", desc: "+25 coins per win" },
              { icon: "🗓️", label: "Daily Login", desc: "+50-200 coins/day" },
              { icon: "📋", label: "Daily Missions", desc: "+10-100 coins" },
              { icon: "🏅", label: "Achievements", desc: "+50-1000 coins" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#1F2937] rounded-xl p-4 text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">
                  {item.label}
                </div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
