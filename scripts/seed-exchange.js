// Contracts
const Token = artifacts.require("Token")
const Exchange = artifacts.require("Exchange")

// Utils
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
const ether = (n) => {
	return new web3.utils.BN(
	web3.utils.toWei(n.toString(), 'ether')
	)
}
const tokens = (n) => ether(n)

const wait = (seconds) => {
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = async function(callback) {
	try {
		const accounts = await web3.eth.getAccounts()

		const token = await Token.deployed()
		console.log('Token fetched', token.address)

		const exchange = await Exchange.deployed()
		console.log('Exchange fetched', exchange.address)

		const sender = accounts[0]
		const receiver = accounts[1]
		let amount = web3.utils.toWei('1', 'ether') // 10,000 tokens

		await token.transfer(receiver, amount, { from: sender })
		console.log(`Tranferred ${amount} tokens from ${sender} to ${receiver}`)

		// Setup exchange users
		const user1 = accounts[0]
		const user2 = accounts[1]

		// User 1 Deposits Ether
		amount = 1
		await exchange.depositEther({ from: user1, value: ether(amount) })
		console.log (`Deposited ${amount} Ether from ${user1}`)

		// User 2 Approves Tokens
		amount = 10000
		await token.approve(exchange.address, tokens(amount), { from: user2 })
		console.log(`Approved ${amount} tokens from ${user2}`)

		// User 2 Deposits Tokens
		await exchange.depositToken(token.address, tokens(amount), { from: user2 })
		console.log(`Deposited ${amount} tokens from ${user2}`)

		///////////////////////////
		// Seed a Cancelled Order
		//

		// User 1 makes order to get tokens
		let result
		let orderId
		result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), { from: user1 })
		console.log(`Made order from ${user1}`)

		// User 1 cancels order
		orderId = result.logs[0].args.id
		await exchange.cancelOrder(orderId, { from: user1 })
		console.log(`Cancelled order from ${user1}`)

		///////////////////////
		// Seed Filled Orders
		//

		// User 1 makes order
		result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), { from: user1 })
		console.log(`Made order from ${user1}`)

		// User 2 fills order
		orderId = result.logs[0].args.id
		await exchange.fillOrder(orderId, { from: user2 })
		console.log(`Filled order from ${user1}`)

		// Wait 1 second
		await wait(1)

		// User 1 makes another order
		result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, ether(0.01), { from: user1 })
		console.log(`Made order from ${user1}`)

		// User 2 fills another order
		orderId = result.logs[0].args.id
		await exchange.fillOrder(orderId, { from: user2 })
		console.log(`Filled order from ${user1}`)

		// Wait 1 second
		await wait(1)

		// User 1 makes final order
		result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, ether(0.15), { from: user1 })
		console.log(`Made order from ${user1}`)

		// User 2 fills another order
		orderId = result.logs[0].args.id
		await exchange.fillOrder(orderId, { from: user2 })
		console.log(`Filled order from ${user1}`)

		// Wait 1 second
		await wait(1)

		/////////////////////
		// Seed Open Orders
		//

		// User 1 makes 10 orders
		for (let i = 1; i <= 10; i++) {
			result = await exchange.makeOrder(token.address, tokens(10 * i), ETHER_ADDRESS, ether(0.01), { from: user1 })
			console.log(`Made order from ${user1}`)
			await wait(1)
		}

		// User 2 makes 10 orders
		for (let i = 1; i <= 10; i++) {
			result = await exchange.makeOrder(ETHER_ADDRESS, ether(0.01), token.address, tokens(10 * i), { from: user2 })
			console.log(`Made order from ${user2}`)
			await wait(1)
		}
	}
	catch(error) {
		console.log(error)
	}
	callback()
}