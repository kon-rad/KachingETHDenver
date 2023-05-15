import React, { useState, useEffect } from "react";
import { Image, HStack, Text, VStack, Flex } from "@chakra-ui/react";
import styles from "./PuzzleGame.module.css";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { useFormContext } from "../../context/FormContext";
import { useSession } from "next-auth/react";
import axios from "axios";
import Sparkles from "react-sparkle";
import { TypeAnimation } from "react-type-animation";

const CURRENT_WEEK = process.env.NEXT_PUBLIC_CURRENT_WEEK || 1;
const CHALLENGE_TITLE =
  process.env.NEXT_PUBLIC_CHALLENGE_TITLE || "The Controller";

const NOT_MINTED = "NOT_MINTED";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

const DEFAULT_PUZZLE_STATE = [1, 2, 3, 4, 5, 6, 7, 8, null];

const SHUFFLES_COUNT = process.env.NEXT_PUBLIC_DEV_MODE ? 1 : 1000;

type PuzzleGame = (number | null)[];

type GameLog = {
  puzzleState: PuzzleGame;
  moveTimeStamp: number;
  moveNumber: number;
};

const checkIsSolved = (puzzle: PuzzleGame) => {
  return puzzle.every((item: number | null, index: number) => {
    return item === index + 1 || item === null;
  });
};

export const PuzzleGame = () => {
  const [displayStartScreen, setDisplayStartScreen] = useState<boolean>(true);
  const [puzzle, setPuzzle] = useState<PuzzleGame>(DEFAULT_PUZZLE_STATE);
  const [shufflingPuzzle, setShufflingPuzzle] =
    useState<PuzzleGame>(DEFAULT_PUZZLE_STATE);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [mintingStatus, setMintingStatus] = useState<string>(NOT_MINTED);
  const [mintTxhash, setMintTxHash] = useState<string>("");
  const [mintErrorMessage, setMintErrorMessage] = useState<string>("");
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [pendingMint, setPendingMint] = useState<boolean>(false);
  const [isMintingScreen, setIsMintingScreen] = useState<boolean>(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [gameLog, setGameLog] = useState<GameLog[]>([]);
  const [moveNumber, setMoveNumber] = useState<number>(0);
  const [shuffleCount, setShuffleCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const { setType } = useFormContext();
  const { data: session } = useSession();
  const address = session && session.user.address;

  useEffect(() => {
    const isPuzzleSolved = checkIsSolved(puzzle);

    if (isStarted && isPuzzleSolved) {
      setIsStarted(false);
      setIsSolved(true);
      setIsStarted(false);
    }
  }, [puzzle]);

  useEffect(() => {
    if (isShuffling) {
      const newShufflingPuzzle = randomMove([...shufflingPuzzle]);
      setShufflingPuzzle(newShufflingPuzzle);
      setShuffleCount(shuffleCount + 1);
      if (shuffleCount > SHUFFLES_COUNT) {
        setIsShuffling(false);
        setIsStarted(true);
        setPuzzle(shufflingPuzzle);
      }
    }
  }, [shuffleCount]);

  const startGame = async () => {
    setIsShuffling(true);
    setShuffleCount(1);
    setIsSolved(false);
    setIsStarted(true);
    setGameLog([]);
    setStartTime(Date.now());
    setDisplayStartScreen(false);
    setIsMintingScreen(false);
    setMintingStatus(NOT_MINTED);
  };

  const handleMintNFT = async () => {
    setIsMintingScreen(true);
    setPendingMint(true);
    try {
      const fetchResult = await axios.get("/api/mint", {
        params: { recipient: address },
      });
      console.log(
        `api fetchResult: ${JSON.stringify(fetchResult)}`,
        fetchResult.data.response.hash
      );

      if (fetchResult.status === 200) {
        setMintingStatus(SUCCESS);
        setMintTxHash(fetchResult.data.response.hash);
      } else {
        setMintingStatus(ERROR);
        setMintErrorMessage(fetchResult.data.message);
        console.error(
          `There was an error with the mint: ${fetchResult.data.message}`
        );
      }
      setPendingMint(false);
    } catch (e: any) {
      setPendingMint(false);
      setMintingStatus(ERROR);
      setMintErrorMessage("");
      console.error("There was an error with the fetch request to mint");
    }
  };

  const getPossibleMoves = (nullIndex: number): number[] => {
    let possibleMoves: number[] = [];
    if (nullIndex === 0) {
      possibleMoves = [1, 3];
    } else if (nullIndex === 1) {
      possibleMoves = [-1, 1, 3];
    } else if (nullIndex === 2) {
      possibleMoves = [-1, 3];
    } else if (nullIndex === 3) {
      possibleMoves = [-3, 1, 3];
    } else if (nullIndex === 4) {
      possibleMoves = [-3, -1, 1, 3];
    } else if (nullIndex === 5) {
      possibleMoves = [-3, -1, 3];
    } else if (nullIndex === 6) {
      possibleMoves = [-3, 1];
    } else if (nullIndex === 7) {
      possibleMoves = [-3, -1, 1];
    } else if (nullIndex === 8) {
      possibleMoves = [-3, -1];
    }
    return possibleMoves;
  };

  const randomMove = (puzzleCopy: PuzzleGame): PuzzleGame => {
    const nullIndex = puzzleCopy.indexOf(null);
    const possibleMoves = getPossibleMoves(nullIndex);
    const moveIndex =
      nullIndex +
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    [puzzleCopy[moveIndex], puzzleCopy[nullIndex]] = [
      puzzleCopy[nullIndex],
      puzzleCopy[moveIndex],
    ];
    return puzzleCopy;
  };

  const getGameTime = () => {
    if (gameLog.length === 0) {
      return "0:00";
    }
    const endTime = gameLog[gameLog.length - 1].moveTimeStamp;
    const timeDiff =
      new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(timeDiff / 1000 / 60);
    const seconds = Math.floor(timeDiff / 1000) % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const handlePuzzleClick = (index: number) => {
    const nullIndex = puzzle.indexOf(null);
    const puzzleCopy = [...puzzle];
    const possibleMoves = getPossibleMoves(nullIndex);
    if (
      index === nullIndex ||
      !possibleMoves.find((move) => nullIndex + move === index)
    ) {
      return;
    }

    [puzzleCopy[index], puzzleCopy[nullIndex]] = [
      puzzleCopy[nullIndex],
      puzzleCopy[index],
    ];
    setMoveNumber(moveNumber + 1);
    setPuzzle(puzzleCopy);
    setGameLog([
      ...gameLog,
      {
        moveTimeStamp: Date.now(),
        moveNumber: moveNumber + 1,
        puzzleState: [...puzzleCopy],
      },
    ]);
  };

  const getCornerClassName = (index: number): string => {
    if (index === 0) {
      return styles.puzzleItemTopLeft;
    } else if (index === 2) {
      return styles.puzzleItemTopRight;
    } else if (index === 6) {
      return styles.puzzleItemBottomLeft;
    } else if (index === 8) {
      return styles.puzzleItemBottomRight;
    }
    return "";
  };

  const renderPuzzleOverlay = () => {
    if (displayStartScreen) {
      return (
        <div
          className={styles.puzzleOverlay}
          style={{ backgroundColor: "rgb(255 255 255 / 0%)" }}
        >
          {isShuffling ? (
            <Image src="keyp_spinner.svg" alt="" w="4rem" />
          ) : (
            <button className={styles.startButton} onClick={startGame}>
              Start Game
            </button>
          )}
        </div>
      );
    }
    if (isMintingScreen) {
      return (
        <div className={styles.mintingOverlay}>
          <div className={styles.mintingTop}>
            <Image
              className={styles.mintingImage}
              src="puzzle/nft-image-sm.png"
              alt="a console game controller"
            />
            <div className={styles.mintingTopText}>
              <TypeAnimation
                sequence={[
                  // Same String at the start will only be typed once, initially
                  "We're airdropping the NFT into your wallet.",
                  1000,
                ]}
                speed={50}
                className={styles.mintingHeading}
                repeat={Infinity}
              />
              <p className={styles.mintingSubheading}>
                This might take a minute.
              </p>
            </div>
          </div>
          <div className={styles.mintingResultContainer}>
            {pendingMint && <Image src="keyp_spinner.svg" alt="" w="3rem" />}
            {mintingStatus === SUCCESS && (
              <HStack>
                <CheckCircleIcon mr={"4"} />
                <Text>
                  View transaction{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://${
                      process.env.PUBLIC_NEXT_NETWORK === "polygon"
                        ? "polygonscan.com"
                        : "mumbai.polygonscan.com/"
                    }/tx/${mintTxhash}`}
                  >
                    here
                  </a>
                </Text>
              </HStack>
            )}
            {mintingStatus === ERROR && (
              <HStack>
                <WarningIcon fontSize="xl" mr={"4"} />
                <Text>😱 There was an error {mintErrorMessage}</Text>
              </HStack>
            )}
          </div>
          <div className={styles.mintingBottom}>
            <button
              className={styles.overlayButton}
              onClick={() => setType("wallet")}
            >
              Go to Wallet
            </button>
            <button className={styles.overlayButton} onClick={startGame}>
              Play Again
            </button>
          </div>
        </div>
      );
    }
    if (isSolved) {
      return (
        <div className={styles.puzzleOverlay}>
          <Sparkles />
          <div className={styles.puzzleSolvedPanel}>
            <h3 className={styles.overlayHeading}>You solved the puzzle!</h3>
            <button className={styles.mintNFTButton} onClick={handleMintNFT}>
              Mint NFT
            </button>
            <button className={styles.startButton} onClick={startGame}>
              Play Again
            </button>
          </div>
          <Flex width="100%" direction="column" justify="end">
            <HStack p="8" justify="space-between">
              <p className={styles.overlayText}>{getGameTime()} minutes</p>
              <p className={styles.overlayText}>{gameLog.length} moves</p>
            </HStack>
          </Flex>
        </div>
      );
    }
  };

  return (
    <div className={styles.puzzle}>
      <div className={styles.puzzleContainer}>
        {puzzle.map((item, index) => (
          <div
            key={index}
            style={{
              ["backgroundImage" as any]: `url(/puzzle/week-${CURRENT_WEEK}/${
                // when puzzle is solved (start screen and end screen) display the entire solved puzzle with the missing piece
                item === null && checkIsSolved(puzzle) ? index + 1 : item
              }.png)`,
            }}
            className={`puzzle-item-${index + 1} ${
              item === null && !checkIsSolved(puzzle) ? "puzzle-item-empty" : ""
            } ${styles.puzzleItem} ${getCornerClassName(index)}`}
            onClick={() => handlePuzzleClick(index)}
          ></div>
        ))}
        {renderPuzzleOverlay()}
      </div>
    </div>
  );
};
