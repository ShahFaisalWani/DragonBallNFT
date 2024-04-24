import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "./TokenCard.css";
import { dragonBallContract } from "./App";
import CARD_ARRAY from "./assets/CardArray.json";

const TokenCard = ({ token, onSuccess, ownerAccount }) => {
  const [visible, setVisible] = useState(false);
  const [address, setAddress] = useState("");

  const onTransfer = async () => {
    if (!address) return;
    await dragonBallContract.methods
      .transferFrom(ownerAccount, address, token.tokenId)
      .send({ from: ownerAccount })
      .on("transactionHash", (hash) => {
        onSuccess(token.tokenId);
        setVisible(false);
      });
  };

  return (
    <>
      <div className="card">
        <img
          crossOrigin="anonymous"
          src={CARD_ARRAY.filter((card) => card.uid === token.img)[0].img}
          alt={token}
          onClick={() => setVisible(true)}
        />
        {token.count > 1 && <h2>x{token.count}</h2>}
      </div>
      <Dialog
        header="Transfer"
        visible={visible}
        style={{ width: "50vw" }}
        onHide={() => setVisible(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              onClick={() => setVisible(false)}
              className="p-button-text"
            />
            <Button label="Confirm" onClick={onTransfer} autoFocus />
          </div>
        }
      >
        <InputText
          placeholder="address"
          className="token-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </Dialog>
    </>
  );
};

export default TokenCard;
