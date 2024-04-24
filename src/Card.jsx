import React from "react";
import classnames from "classnames";
import dragonball from "/images/ball.png";
import "./Card.css";

const Card = ({ onClick, card, index, isInactive, isFlipped, isDisabled }) => {
  const handleClick = () => {
    !isFlipped && !isDisabled && onClick(index);
  };

  return (
    <div
      className={classnames("card", {
        "is-flipped": isFlipped,
        "is-inactive": isInactive,
      })}
      onClick={handleClick}
    >
      <div className="card-face card-font-face">
        <img src={dragonball} alt="dragonball" />
      </div>
      <div className="card-face card-back-face">
        <img src={card.img} alt={card.name} />
      </div>
    </div>
  );
};

export default Card;
