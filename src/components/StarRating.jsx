import "./StarRating.css";

export default function StarRating({ value, onChange, size = "md", readonly = false }) {
  return (
    <div className={`star-rating star-${size} ${readonly ? "readonly" : ""}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          className={`star ${star <= (value || 0) ? "filled" : "empty"}`}
          onClick={() => !readonly && onChange?.(star === value ? 0 : star)}
          title={readonly ? `${value}/5` : `Rate ${star} star${star > 1 ? "s" : ""}`}
          disabled={readonly}
        >
          {star <= (value || 0) ? "★" : "☆"}
        </button>
      ))}
      {value > 0 && !readonly && (
        <span className="star-label">
          {["", "Not great", "It was ok", "Pretty good", "Really good", "We loved it!"][value]}
        </span>
      )}
    </div>
  );
}
