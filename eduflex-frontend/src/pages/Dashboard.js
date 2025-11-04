import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import SearchIcon from "../assets/search.svg";

const cardsData = [
  {
    title: "Courses",
    description: "View and manage all your enrolled courses.",
    image: "https://images.unsplash.com/photo-1579645899072-e14c6b840afa?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Assignments",
    description: "Check pending and submitted assignments.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Grades",
    description: "Track your performance and progress.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
  },
];

function Dashboard() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // GET ALL CONTEXT VALUES INCLUDING BACKEND STATUS
  const { loading, stats = {}, backendConnected = false } = useApp();

  useEffect(() => {
    const mapNumberRange = (n, a, b, c, d) =>
      ((n - a) * (d - c)) / (b - a) + c;

    const initCard = (card) => {
      const cardContent = card.querySelector(".card__content");
      const gloss = card.querySelector(".card__gloss");
      if (!cardContent || !gloss) return;
      requestAnimationFrame(() => {
        gloss.classList.add("card__gloss--animatable");
      });
      card.addEventListener("mousemove", (e) => {
        const pointerX = e.clientX;
        const pointerY = e.clientY;
        const cardRect = card.getBoundingClientRect();
        const halfWidth = cardRect.width / 2;
        const halfHeight = cardRect.height / 2;
        const cardCenterX = cardRect.left + halfWidth;
        const cardCenterY = cardRect.top + halfHeight;
        const deltaX = pointerX - cardCenterX;
        const deltaY = pointerY - cardCenterY;
        const distanceToCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = Math.max(halfWidth, halfHeight);
        const degree = mapNumberRange(distanceToCenter, 0, maxDistance, 0, 10);
        const rx = mapNumberRange(deltaY, 0, halfWidth, 0, 1);
        const ry = mapNumberRange(deltaX, 0, halfHeight, 0, 1);

        cardContent.style.transform = `perspective(400px) rotate3d(${-rx}, ${ry}, 0, ${degree}deg)`;
        gloss.style.transform = `translate(${-ry * 100}%, ${-rx * 100}%) scale(2.4)`;
        gloss.style.opacity = `${mapNumberRange(
          distanceToCenter,
          0,
          maxDistance,
          0,
          0.6
        )}`;
      });
      card.addEventListener("mouseleave", () => {
        cardContent.style = null;
        gloss.style.opacity = 0;
      });
    };

    document.querySelectorAll(".card").forEach((cardEl) => initCard(cardEl));
  }, []);

  const filteredCards = cardsData.filter(
    (card) =>
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem", marginLeft: "5rem" }}>
      {/* Add floating animation CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Dashboard
      </h1>

      {/* Backend Connection Status */}
      {backendConnected ? (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          border: '1px solid #c3e6cb'
        }}>
          ✅ Connected to Backend Server
        </div>
      ) : (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ Using Demo Data (Backend Offline)
        </div>
      )}

      {/* Floating Badge Stats */}
      <div style={{ position: "relative", marginBottom: "3rem", minHeight: "80px" }}>
        <div style={{
          position: "absolute",
          top: "-10px",
          right: "20px",
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          fontSize: "0.875rem",
          fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          zIndex: 10,
          animation: "float 3s ease-in-out infinite",
          cursor: "pointer",
          transition: "transform 0.2s ease"
        }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          📚 {stats.totalCourses ?? 0} Courses
        </div>
        <div style={{
          position: "absolute",
          top: "30px",
          right: "150px",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          fontSize: "0.875rem",
          fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          zIndex: 10,
          animation: "float 3s ease-in-out infinite 1s",
          cursor: "pointer",
          transition: "transform 0.2s ease"
        }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          📝 {stats.pendingAssignments ?? 0} Tasks
        </div>
        <div style={{
          position: "absolute",
          top: "60px",
          right: "280px",
          background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          fontSize: "0.875rem",
          fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
          zIndex: 10,
          animation: "float 3s ease-in-out infinite 2s",
          cursor: "pointer",
          transition: "transform 0.2s ease"
        }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          🎯 {stats.averageGrade ?? 0}% Avg Grade
        </div>
        <div style={{
          position: "absolute",
          top: "10px",
          right: "400px",
          background: loading ? "linear-gradient(135deg, #6b7280, #4b5563)" : "linear-gradient(135deg, #059669, #047857)",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          fontSize: "0.875rem",
          fontWeight: "bold",
          boxShadow: `0 4px 12px rgba(${loading ? '107, 114, 128' : '5, 150, 105'}, 0.3)`,
          zIndex: 10,
          animation: "float 3s ease-in-out infinite 0.5s",
          cursor: "pointer",
          transition: "all 0.3s ease"
        }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          {loading ? "⏳ Loading..." : "✅ Ready"}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", width: "300px", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.5rem 1rem 0.5rem 2.5rem",
            width: "100%",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />
        <img
          src={SearchIcon}
          alt="Search"
          style={{
            position: "absolute",
            left: "0.8rem",
            top: "50%",
            transform: "translateY(-50%)",
            width: "1rem",
            height: "1rem",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {filteredCards.map((card, index) => (
          <div
            key={index}
            className="card"
            onClick={() => {
              if (card.title === "Courses") navigate("/courses");
              if (card.title === "Assignments") navigate("/assignments");
              if (card.title === "Grades") navigate("/grades");
            }}
            style={{
              position: "relative",
              width: "250px",
              height: "300px",
              borderRadius: "1rem",
              overflow: "hidden",
              boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              cursor: "pointer",
              background: "#fff",
              transition: "transform 0.3s ease",
            }}
          >
            <div className="card__content" style={{ width: "100%", height: "100%" }}>
              <div
                className="card__gloss"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(120deg, rgba(255,255,255,0.6), transparent)",
                  opacity: 0,
                  pointerEvents: "none",
                  transition: "opacity 0.3s ease",
                }}
              ></div>
              <img
                src={card.image}
                alt={card.title}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderTopLeftRadius: "1rem",
                  borderTopRightRadius: "1rem",
                }}
              />
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  margin: "0.5rem",
                }}
              >
                {card.title}
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#555",
                  margin: "0.5rem",
                }}
              >
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
