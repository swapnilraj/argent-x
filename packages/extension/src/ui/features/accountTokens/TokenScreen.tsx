import { BigNumber, utils } from "ethers"
import { FC } from "react"
import CopyToClipboard from "react-copy-to-clipboard"
import { useForm } from "react-hook-form"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Call, stark } from "starknet"
import styled from "styled-components"
import useSWR from "swr"
import { Schema, object } from "yup"

import { inputAmountSchema, parseAmount } from "../../../shared/token"
import { prettifyCurrencyValue } from "../../../shared/tokenPrice.service"
import { Alert } from "../../components/Alert"
import { Button, ButtonGroup } from "../../components/Button"
import { IconBar } from "../../components/IconBar"
import { AtTheRateIcon } from "../../components/Icons/AtTheRateIcon"
import { StyledControlledInput } from "../../components/InputText"
import { Spinner } from "../../components/Spinner"
import { FormError } from "../../components/Typography"
import { routes } from "../../routes"
import { addressSchema } from "../../services/addresses"
import { getEstimatedFee } from "../../services/backgroundTransactions"
import {
  getUint256CalldataFromBN,
  sendTransaction,
} from "../../services/transactions"
import { Account } from "../accounts/Account"
import { useSelectedAccount } from "../accounts/accounts.state"
import { useYupValidationResolver } from "../settings/useYupValidationResolver"
import { TokenIcon } from "./TokenIcon"
import { useTokenBalanceToCurrencyValue } from "./tokenPriceHooks"
import { toTokenView } from "./tokens.service"
import { useTokensWithBalance } from "./tokens.state"

export const TokenScreenWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 32px 48px 32px;

  > form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  ${Button} {
    margin-top: 24px;
  }
`

export const TokenTitle = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`

export const TokenName = styled.h3`
  font-style: normal;
  font-weight: 600;
  font-size: 15px;
  line-height: 20px;
  color: #ffffff;
`

export const BalanceAlert = styled(Alert)`
  padding-top: 32px;
  padding-bottom: 32px;
  margin-bottom: 20px;
`

const BalanceTitle = styled.div`
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 21px;
`

const BalanceAmount = styled.div`
  font-style: normal;
  font-weight: bold;
  font-size: 34px;
  line-height: 41px;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const BalanceSymbol = styled.div`
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 25px;
  margin-left: 5px;
`

const InlineBalanceAndSymbol = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
`

const TokenBalance = styled.div`
  font-size: 17px;
  text-align: center;
  color: #ffffff;
  margin-top: 8px;
`

const InputGroupAfter = styled.div`
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
`

const StyledMaxButton = styled(Button)`
  border-radius: 100px;
  background-color: #5c5b59;
  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 600;
  font-size: 13px;
  line-height: 18px;
  margin-top: 0 !important;
  padding: 4px 8px;
`

const InputTokenSymbol = styled.span`
  text-transform: uppercase;
  font-weight: 600;
  font-size: 17px;
  line-height: 22px;
  color: #8f8e8c;
`

interface SendInput {
  recipient: string
  amount: string
}
const SendSchema: Schema<SendInput> = object().required().shape({
  recipient: addressSchema,
  amount: inputAmountSchema,
})

export const useMaxFeeEstimateForTransfer = (
  tokenAddress?: string,
  balance?: BigNumber,
  account?: Account,
): {
  maxFee?: BigNumber
  error?: any
  loading: boolean
} => {
  if (!account || !balance || !tokenAddress) {
    throw new Error("Account, TokenAddress and Balance are required")
  }

  const { compileCalldata, estimatedFeeToMaxFee: addOverheadToFee } = stark

  const call: Call = {
    contractAddress: tokenAddress ?? "",
    entrypoint: "transfer",
    calldata: compileCalldata({
      recipient: account?.address ?? "0",
      amount: getUint256CalldataFromBN(balance ?? BigNumber.from(0)),
    }),
  }

  const {
    data: estimatedFee,
    error,
    isValidating,
  } = useSWR(
    [
      "maxEthTransferEstimate",
      Math.floor(Date.now() / 60e3),
      account.networkId,
    ],
    () => getEstimatedFee(call),
    {
      suspense: false,
      refreshInterval: 15 * 1000,
      shouldRetryOnError: false,
    },
  )

  if (error) {
    return { maxFee: undefined, error, loading: false }
  }

  // Add Overhead to estimatedFee
  if (estimatedFee) {
    const maxFee = addOverheadToFee(
      estimatedFee.suggestedMaxFee.toString(),
      0.2,
    )
    return { maxFee, error: undefined, loading: false }
  }

  return { maxFee: undefined, error: undefined, loading: isValidating }
}

export const TokenScreen: FC = () => {
  const navigate = useNavigate()
  const { tokenAddress } = useParams()
  const account = useSelectedAccount()
  const { tokenDetails } = useTokensWithBalance(account)
  const resolver = useYupValidationResolver(SendSchema)
  const {
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, submitCount },
    control,
    setValue,
    watch,
  } = useForm<SendInput>({
    defaultValues: {
      recipient: "",
      amount: "",
    },
    resolver,
  })

  const formValues = watch()

  const inputAmount = formValues.amount
  const inputRecipient = formValues.recipient

  const inputAmountBN = BigNumber.from(inputAmount)

  const token = tokenDetails.find(({ address }) => address === tokenAddress)
  const currencyValue = useTokenBalanceToCurrencyValue(token)

  const {
    maxFee,
    error: maxFeeError,
    loading: maxFeeLoading,
  } = useMaxFeeEstimateForTransfer(token?.address, token?.balance, account)

  if (!token) {
    return <Navigate to={routes.accounts()} />
  }

  const { address, name, symbol, balance, decimals, image } = toTokenView(token)

  const handleMaxClick = async () => {
    if (token.balance && maxFee) {
      const balanceBn = token.balance

      const maxAmount = balanceBn.sub(maxFee.toString())

      const formattedMaxAmount = utils.formatUnits(
        maxAmount.toString(),
        decimals,
      )

      setValue("amount", formattedMaxAmount)
    }
  }

  const disableSubmit =
    isSubmitting ||
    (submitCount > 0 && !isDirty) ||
    !inputAmount ||
    !inputRecipient ||
    inputAmount > balance ||
    parseFloat(inputAmount) < 0

  return (
    <>
      <IconBar back />
      <TokenScreenWrapper>
        <TokenTitle>
          <TokenIcon url={image} name={name} large />
          <TokenName>{name}</TokenName>
        </TokenTitle>
        <BalanceAlert>
          <BalanceTitle>Your balance</BalanceTitle>
          <InlineBalanceAndSymbol>
            <CopyToClipboard text={balance}>
              <BalanceAmount>{balance}</BalanceAmount>
            </CopyToClipboard>
            <BalanceSymbol>{symbol}</BalanceSymbol>
          </InlineBalanceAndSymbol>
          {currencyValue !== undefined && (
            <TokenBalance>{prettifyCurrencyValue(currencyValue)}</TokenBalance>
          )}
        </BalanceAlert>

        <ButtonGroup
          as="form"
          onSubmit={handleSubmit(({ amount, recipient }) => {
            sendTransaction({
              to: address,
              method: "transfer",
              calldata: {
                recipient,
                amount: getUint256CalldataFromBN(parseAmount(amount, decimals)),
              },
            })
            navigate(routes.accountTokens())
          })}
        >
          <StyledControlledInput
            autoComplete="off"
            control={control as any}
            placeholder="Amount"
            name="amount"
            type="text"
          >
            <InputGroupAfter>
              <InputTokenSymbol>{token.symbol}</InputTokenSymbol>
              {token.balance && !inputAmountBN.eq(token.balance) && (
                <StyledMaxButton type="button" onClick={handleMaxClick}>
                  {maxFeeLoading ? <Spinner size={18} /> : "MAX"}
                </StyledMaxButton>
              )}
            </InputGroupAfter>
          </StyledControlledInput>
          {maxFeeError && <FormError>{maxFeeError.message}</FormError>}
          {errors.amount && <FormError>{errors.amount.message}</FormError>}
          <StyledControlledInput
            autoComplete="off"
            control={control}
            placeholder="Recipient"
            name="recipient"
            type="text"
          >
            {!inputRecipient && (
              <InputGroupAfter>
                <AtTheRateIcon />
              </InputGroupAfter>
            )}
          </StyledControlledInput>
          {errors.recipient && (
            <FormError>{errors.recipient.message}</FormError>
          )}
          <Button disabled={disableSubmit} type="submit">
            Send
          </Button>
          <Button onClick={() => navigate(routes.hideToken(token.address))}>
            Hide
          </Button>
        </ButtonGroup>
      </TokenScreenWrapper>
    </>
  )
}
