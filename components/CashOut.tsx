import React, { useState } from "react";
import { Box, Button, Heading, Image, Text, VStack } from "@chakra-ui/react";
import UseKeypApi from "../hooks/useKeypApi";
import { useSession } from "next-auth/react";
import { useFormContext } from "../context/FormContext";
import ButtonSpacingWrapper from "./ButtonSpacingWrapper";

/**
 * @remarks - this component lets user withdraw from their wallet. ButtonSpacingWrapper is used place "Back" button at the bottom of the page
 * @returns - CashOut component that displays offramps for users to withdraw from their wallet
 */
const CashOut = () => {
  const [coinbaseLoading, setCoinbaseLoading] = useState(false);
  const { handleHomePage } = useFormContext();

  const handleClickCashOut = async (rampType: string) => {
    const request = await UseKeypApi({
      method: "GET",
      endpoints: "ramps",
      urlParams1: "off",
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
            Withdraw from your Wallet
          </Text>
        </Heading>
        <VStack spacing="1.5rem" mt="2.5rem">
          {/* <Box w="full">
          <Button
            variant="ramps"
            color="#22272F"
            onClick={() => handleClickCashOut("RAMP_NETWORK")}
          >
            <Image src={"payment-ramp.svg"} alt="Ramp" />
          </Button>
        </Box> */}
          <Box w="full">
            <Button
              variant="ramps"
              color="#4A4D53"
              isLoading={coinbaseLoading}
              loadingText="Loading"
              onClick={() => {
                handleClickCashOut("COINBASE");
                setCoinbaseLoading(true);
              }}
            >
              <Image src={"payment-coinbase.svg"} alt="" />
              <Text ml="1rem">Coinbase</Text>
            </Button>
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

export default CashOut;
