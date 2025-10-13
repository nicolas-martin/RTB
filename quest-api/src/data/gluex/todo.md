Swap transaction input usdt0

```
query UserById {
  swaps(
    where: {user_: {id: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60"}, inputToken: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb"}
  ) {
    inputAmount
    inputToken
    outputToken
    finalOutputAmount
  }
}
```
