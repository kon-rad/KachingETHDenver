import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Image,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { RxCopy } from "react-icons/rx";
import { useSession } from "next-auth/react";
import UseKeypApi from "../hooks/useKeypApi";
import { useFormContext } from "../context/FormContext";
import ButtonSpacingWrapper from "./ButtonSpacingWrapper";

/**
 * @remarks - this component lets user fund their wallet. ButtonSpacingWrapper is used place "Back" button at the bottom of the page
 * @returns - Fund component that displays offramps for users to fund their wallet
 */
const Fund = () => {
  const [rampLoading, setRampLoading] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(false);
  const { data: session } = useSession();
  const { handleHomePage } = useFormContext();

  const handleCopyAddress = () => {
    const address = session && session.user.address;
    navigator.clipboard.writeText(address || "");
    setOpenTooltip(true);
    setTimeout(() => {
      setOpenTooltip(false);
    }, 1000);
  };

  const handleClickFund = async (rampType: string) => {
    const request = await UseKeypApi({
      accessToken: session?.user.accessToken,
      method: "GET",
      endpoints: "ramps",
      urlParams1: "on",
      urlParams2: rampType,
    });
    if (request?.url) window.location = request?.url;
    return request.url || null;
  };

  return (
    <ButtonSpacingWrapper isTransactionSlider={true}>
      <Box w={["full", "full", "80%", "50%"]} mx="auto">
        <Heading as="h3">
          <Text color="socialIconsGray" textAlign="center">
            Fund your Wallet
          </Text>
        </Heading>
        <VStack spacing="1.5rem" mt="2.5rem">
          <Box w="full">
            <Button
              variant="ramps"
              color="#22272F"
              onClick={() => {
                handleClickFund("RAMP_NETWORK");
                setRampLoading(true);
              }}
            >
              <Image src={"payment-ramp.svg"} alt="Ramp" />
            </Button>
          </Box>
          <Box w="full">
            <Tooltip
              label="Address copied to clipboard"
              isOpen={openTooltip}
              placement="bottom-start"
            >
              <Button
                variant="ramps"
                color="formBlueDark"
                onClick={handleCopyAddress}
              >
                <RxCopy />
                <Text ml="1rem">Copy Address</Text>
              </Button>
            </Tooltip>
          </Box>
        </VStack>
      </Box>
      <Box mt="1rem" mx="-1.5rem" mb="-1rem">
        <Button variant="formBlue" onClick={() => handleHomePage()}>
          Back
        </Button>
      </Box>
    </ButtonSpacingWrapper>
  );
};

export default Fund;
