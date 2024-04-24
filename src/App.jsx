import { useEffect, useState, useRef } from "react";
import Card from "./Card";
import logoImg from "/images/logo.png";
import TokenCard from "./TokenCard";
import "./App.css";
import "./Loader.css";
import CARD_ARRAY from "./assets/CardArray.json";
import Web3 from "web3";
import dragonBallABI from "./contracts/abi/DragonBallToken.json";

const contractAddress = "0xC12422F59b8d441E1A27C6a2B2C2Dcf9e559464F"; //replace with your contract address

export const web3 = new Web3(window.ethereum);

export const dragonBallContract = new web3.eth.Contract(
  dragonBallABI,
  contractAddress
);

function shuffleCards(array) {
  const length = array.length;
  for (let i = length; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * i);
    const currentIndex = i - 1;
    const temp = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temp;
  }
  return array;
}

function App() {
  const [cards] = useState(() => shuffleCards(CARD_ARRAY.concat(CARD_ARRAY)));
  const [openCards, setOpenCards] = useState([]);
  const [clearedCards, setClearedCards] = useState({});
  const [shouldDisableAllCards, setShouldDisableAllCards] = useState(false);

  const timeout = useRef(null);

  const disable = () => {
    setShouldDisableAllCards(true);
  };
  const enable = () => {
    setShouldDisableAllCards(false);
  };

  const evaluate = () => {
    const [first, second] = openCards;
    enable();
    if (cards[first].name === cards[second].name) {
      setClearedCards((prev) => ({ ...prev, [cards[first].name]: true }));
      setOpenCards([]);
      handleMatch(cards[first]);
      return;
    }

    timeout.current = setTimeout(() => {
      setOpenCards([]);
    }, 500);
  };

  const handleCardClick = (index) => {
    if (openCards.length === 1) {
      setOpenCards((prev) => [...prev, index]);
      disable();
    } else {
      clearTimeout(timeout.current);
      setOpenCards([index]);
    }
  };

  useEffect(() => {
    let timeout = null;
    if (openCards.length === 2) {
      timeout = setTimeout(evaluate, 300);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [openCards]);

  useEffect(() => {
    checkCompletion();
  }, [clearedCards]);

  const checkIsFlipped = (index) => {
    return openCards.includes(index);
  };

  const checkIsInactive = (card) => {
    return Boolean(clearedCards[card.name]);
  };

  // --------- Web3 -----------
  const [ownerAccount, setOwnerAccount] = useState();
  const [ownerNFTs, setOwnerNFTs] = useState([]);
  const [minting, setMinting] = useState(false);

  const [loading, setLoading] = useState(false);

  async function getTokenIds(account) {
    if (!account) return;
    const tokenIds = await dragonBallContract.methods
      .getAllTokensOfOwner(account)
      .call();
    const tokens = tokenIds.map((token) => Number(token));
    return tokens;
  }

  async function fetchTokens(account) {
    if (!account) return;
    setLoading(true);
    setOwnerNFTs([]);
    const tokens = await getTokenIds(account);

    let arr = [];
    const fetchPromises = tokens.map(async (token) => {
      let tokenURI = await dragonBallContract.methods.tokenURI(token).call();
      if (tokenURI) {
        const res = await fetch(
          "https://gateway.pinata.cloud/ipfs/" + tokenURI.split("//")[1]
        );
        const data = await res.json();
        const imgUri = data.image.split("//")[1];
        const index = arr.findIndex((item) => item.img === imgUri);

        if (index !== -1) {
          arr[index].count++;
        } else {
          arr.push({ img: imgUri, count: 1, tokenId: parseInt(token) });
        }
      }
    });

    await Promise.all(fetchPromises);

    setOwnerNFTs(arr);
    setLoading(false);
  }

  async function updateTokens(token) {
    let supply = await dragonBallContract.methods.totalSupply().call();
    const totalSupply = Number(supply) + 1;

    await fetch("https://gateway.pinata.cloud/ipfs/" + token.split("//")[1], {
      method: "get",
    }).then(async (res) => {
      const data = await res.json();
      const imgUri = data.image.split("//")[1];

      const index = ownerNFTs.findIndex((item) => item.img === imgUri);

      if (index !== -1) {
        const newArr = ownerNFTs;
        newArr[index].count++;
        setOwnerNFTs(newArr);
      } else {
        setOwnerNFTs([
          ...ownerNFTs,
          { img: imgUri, count: 1, tokenId: totalSupply },
        ]);
      }
    });
  }

  const handleMatch = (card) => {
    dragonBallContract.methods
      .mint(ownerAccount, card.json)
      .send({ from: ownerAccount })
      .on("transactionHash", async (hash) => {
        setMinting(true);
      })
      .on("receipt", async () => {
        await updateTokens(card.json);
        setMinting(false);
      });
  };

  const connect = async () => {
    const accounts = await web3.eth.requestAccounts();
    if (!accounts) return;
    const account = accounts[0];
    setOwnerAccount(account);
    await fetchTokens(account);
  };

  const disconnect = async () => {
    setOwnerAccount("");
    setOwnerNFTs([]);
    window.ethereum?.removeAllListeners();
    web3.eth?.removeAllListeners();
  };

  const handleAccountsChanged = () => {
    window.ethereum.on("accountsChanged", async (newAccount) => {
      setOwnerAccount(newAccount[0]);
      await fetchTokens(newAccount[0]);
    });
  };

  useEffect(() => {
    handleAccountsChanged();
    return () => {
      window.ethereum?.removeAllListeners();
      web3.eth?.removeAllListeners();
    };
  }, []);

  return (
    <div className="App">
      <div className="navbar">
        <div>
          <img src={logoImg} height={150} />
        </div>
        <div className="title">
          <h1>Memory Card Game</h1>
        </div>
        <div className="address">
          {ownerAccount && (
            <>
              <h3>{`${ownerAccount.substring(0, 10)}...${ownerAccount.substring(
                ownerAccount.length - 10
              )}`}</h3>
              <button onClick={disconnect}>
                <i className="ri-logout-box-r-line"></i>
              </button>
            </>
          )}
        </div>
      </div>
      {!ownerAccount ? (
        <div className="box">
          <button className="button-73" onClick={connect}>
            Connect
          </button>
        </div>
      ) : (
        <>
          <div className="main-container">
            <div className="container">
              {cards.map((card, index) => {
                return (
                  <Card
                    key={index}
                    card={card}
                    index={index}
                    isDisabled={shouldDisableAllCards}
                    isInactive={checkIsInactive(card)}
                    isFlipped={checkIsFlipped(index)}
                    onClick={handleCardClick}
                  />
                );
              })}
            </div>
            {minting && (
              <div className="minting">
                <iframe
                  src="https://giphy.com/embed/xULW8ohR9OvNoohoEU"
                  width="600"
                  height="600"
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
                <h2>Minting Token. Please do not leave the page</h2>
              </div>
            )}
          </div>
          <div className="box">
            <h1>My Collections</h1>
            {loading && (
              <div className="loader-container">
                <div className="loader"></div>
              </div>
            )}
            <div className="collection">
              {ownerNFTs.length > 0 &&
                ownerNFTs.map((token, i) => (
                  <TokenCard
                    token={token}
                    ownerAccount={ownerAccount}
                    key={i}
                    onSuccess={(tokenId) => {
                      const newArr = ownerNFTs.filter(
                        (item) => item.tokenId !== tokenId
                      );
                      setOwnerNFTs(newArr);
                    }}
                  />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
