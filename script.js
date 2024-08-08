let app = {}; // Define app as a global variable

document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded and parsed");
  initializeApp();
});

function addCandidate() {
  const candidateInput = document.getElementById('candidateName');
  const candidateName = candidateInput.value.trim();
  if (candidateName) {
    app.candidates.push({ name: candidateName });
    const candidateList = document.getElementById('candidateList');
    const listItem = document.createElement('li');
    listItem.textContent = candidateName;
    candidateList.appendChild(listItem);
    candidateInput.value = '';
    console.log("Candidate added:", app.candidates);  // Debugging
  } else {
    alert('Please enter a candidate name.');
  }
}

async function startElection() {
  try {
    console.log("Starting election function called");
    console.log("Current candidates:", app.candidates);  // Debugging

    const isElectionOngoing = await app.contract.electionStarted();
    console.log("Is election ongoing:", isElectionOngoing);

    if (isElectionOngoing) {
      const userConfirmation = confirm("There is an ongoing election. Do you want to end it and start a new one?");
      if (userConfirmation) {
        const endElectionTx = await app.contract.endElection();
        console.log("End election transaction:", endElectionTx);
        await endElectionTx.wait();
        console.log("Current election ended");
      } else {
        alert("Cannot start a new election while one is ongoing.");
        return;
      }
    }

    if (!app.electionDuration.value) {
      console.error("Election duration not set");
      alert("Set election duration in minutes.");
      return;
    }

    const candidateNames = app.candidates.map(c => c.name).filter(name => name); // Ensure no empty names
    if (candidateNames.length === 0) {
      console.error("Candidate list is empty");
      alert('Candidate list is empty. Please add candidates before starting the election.');
      return;
    }

    const _votingDuration = parseInt(app.electionDuration.value);
    console.log("Starting election with candidates:", candidateNames, "and duration:", _votingDuration);

    // Log the parameters before sending
    console.log("Contract call parameters:", { candidateNames, _votingDuration });

    const startElectionTx = await app.contract.startElection(candidateNames, _votingDuration);
    console.log("Transaction sent:", startElectionTx.hash);

    await startElectionTx.wait();
    console.log("Transaction confirmed:", startElectionTx.hash);

    alert("Election started successfully!");

    app.electionDuration.value = "";

    await refreshPage();
  } catch (error) {
    console.error("Error starting election:", error);
    alert("Failed to start election. Please try again.");
  }
}

async function sendVote() {
  try {
    const candidateId = parseInt(app.vote.value);
    if (isNaN(candidateId) || candidateId < 0) {
      alert('Invalid candidate ID');
      return;
    }

    console.log("Sending vote for candidate ID:", candidateId);

    const tx = await app.contract.voteTo(candidateId); // Updated function name
    await tx.wait();

    alert('Vote cast successfully!');
    await refreshPage();
  } catch (error) {
    console.error("Error sending vote:", error);
    alert('Failed to cast vote. Please try again.');
  }
}

async function getResult() {
  try {
    if (!app.resultContainer) {
      console.error("Result container not found");
      return;
    }

    const results = await app.contract.getVotes(); // Ensure this is the correct function

    console.log("Election results:", results);

    const resultBody = document.getElementById('resultBody');
    resultBody.innerHTML = ''; // Clear previous results

    results.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.name}</td>
        <td>${ethers.BigNumber.from(r.numberOfVotes).toString()}</td>`; // Convert BigNumber to string
      resultBody.appendChild(row);
    });

    app.resultContainer.style.display = 'block'; // Show the results container
  } catch (error) {
    console.error("Error getting results:", error);
    alert('Failed to fetch results. Please try again.');
  }
}




function initializeApp() {
  console.log("Initializing app...");

  const elements = {
    connectWalletBtn: '#connectWallet',
    connectWalletMsg: '#connectWalletMessage',
    votingStation: '#votingStation',
    timerMessage: '#timerMessage',
    voteForm: '#voteForm',
    showResultContainer: '#showResultContainer',
    resultContainer: '#resultContainer', // Ensure this ID matches your HTML
    showResult: '#showResult',
    admin: '#admin',
    candidates: '#candidatesList',
    electionDuration: '#electionDuration',
    startAnElection: '#startElection',
    candidate: '#candidateName',
    addTheCandidate: '#addCandidatebtn',
    mainBoard: '#mainBoard',
    vote: '#vote',
    sendVote: '#sendVote',
    candidateTable: '#candidateTable',
    clearCandidates: '#clearCandidates'
  };

  app = {
    candidates: [],
    contract: null,
    electionDuration: document.getElementById('electionDuration'),
    clearCandidates: document.querySelector(elements.clearCandidates)
  };

  for (const [key, selector] of Object.entries(elements)) {
    app[key] = document.querySelector(selector);
    console.log(`${key}: ${app[key] ? "Found" : "Not found"}`);
  }

  if (app.connectWalletBtn) {
    app.connectWalletBtn.addEventListener('click', () => getAccount());
  }

  if (app.showResult) {
    app.showResult.addEventListener('click', () => getResult());
  }

  if (app.addTheCandidate) {
    app.addTheCandidate.addEventListener('click', () => addCandidate());
  }

  if (app.startAnElection) {
    app.startAnElection.addEventListener('click', () => startElection());
  }

  if (app.sendVote) {
    app.sendVote.addEventListener('click', () => sendVote());
  }

  if (app.clearCandidates) {
    app.clearCandidates.addEventListener('click', clearCandidatesList);
  }

  initializeEthers();
}



async function initializeEthers() {
  console.log("Initializing Ethers...");
  const contractAddress = '0xAD470F46119661415Ee5fD94D5e2246fF2428404';
  const contractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        }
      ],
      "name": "addCandidate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "candidates",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "numberOfVotes",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "checkElectionPeriod",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionStarted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionTimer",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "endElection",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getElectionStatus",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVotes",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "numberOfVotes",
              "type": "uint256"
            }
          ],
          "internalType": "struct Voting.Candidate[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "listOfVoters",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "resetAllVotersStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string[]",
          "name": "_candidates",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "_votingDuration",
          "type": "uint256"
        }
      ],
      "name": "startElection",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "voteTo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_voter",
          "type": "address"
        }
      ],
      "name": "voterStatus",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votingStart",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votingStop",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      app.provider = new ethers.providers.Web3Provider(window.ethereum);
      app.signer = app.provider.getSigner();
      app.contract = new ethers.Contract(contractAddress, contractABI, app.signer);

      // Log the contract methods
      console.log("Contract methods:", Object.keys(app.contract.interface.functions));

      console.log("Ethers initialized successfully");

      const owner = await app.contract.owner();
      console.log("Contract owner:", owner);

      await getAllCandidates();
      refreshPage();
    } catch (error) {
      console.error("Error initializing Ethers:", error);
      alert("Failed to connect to Ethereum. Please ensure MetaMask is installed and connected to the correct network.");
    }
  } else {
    console.error("Ethereum object not found, do you have MetaMask installed?");
    alert("Ethereum object not found. Ensure MetaMask is installed.");
  }
}


function clearCandidatesList() {
  app.candidates = [];
  app.candidateTable.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="2">No candidates added yet</td>
      </tr>
    </tbody>`;
}

async function getAccount() {
  console.log("getAccount function called");
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = await app.signer.getAddress();

    app.connectWalletBtn.textContent = address.slice(0, 10) + "...";
    app.connectWalletMsg.textContent = "You are connected";
    app.connectWalletBtn.disabled = true;

    let owner = await app.contract.owner();
    if (owner.toLowerCase() === address.toLowerCase()) {
      app.admin.style.display = "flex";
    }

    app.votingStation.style.display = "block";
    refreshPage();
    await getAllCandidates();

    const balance = await app.provider.getBalance(address);
    if (ethers.utils.formatEther(balance) < 0.01) {
      alert("Warning: Your balance is low. Ensure you have enough ETH to cover gas fees.");
    }
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    alert("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.");
  }
}

async function refreshPage() {
  try {
    let isElectionStarted = await app.contract.electionStarted();
    if (isElectionStarted) {
      let time = await app.contract.electionTimer();
      if (time > 0) {
        app.timerMessage.innerHTML = `<span id="time">${time}</span> second/s left`;
        app.voteForm.style.display = 'flex';
        app.showResultContainer.style.display = 'none';
      } else {
        app.timerMessage.textContent = "Election has ended";
        app.voteForm.style.display = 'none';
        app.showResultContainer.style.display = 'block';
      }
    } else {
      app.timerMessage.textContent = "No ongoing election";
      app.voteForm.style.display = 'none';
      app.showResultContainer.style.display = 'none';
    }
    await getAllCandidates();
  } catch (error) {
    console.error("Error refreshing page:", error);
    app.timerMessage.textContent = "Unable to fetch election status";
  }
}

async function getAllCandidates() {
  try {
    console.log("Fetching all candidates...");
    let candidates = await app.contract.getVotes();
    console.log("Candidates fetched from contract:", candidates);

    app.candidates = candidates.map(c => ({ id: parseInt(c.id), name: c.name, votes: parseInt(c.numberOfVotes) }));

    console.log("Mapped candidates:", app.candidates);
    updateCandidateTable();
  } catch (error) {
    console.error("Error getting candidates:", error);
    app.candidateTable.innerHTML = '<p>Unable to fetch candidates</p>';
  }
}

function updateCandidateTable() {
  console.log("Updating candidate table with:", app.candidates);

  app.candidateTable.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody></tbody>`;

  const tableBody = app.candidateTable.querySelector('tbody');

  if (app.candidates.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 2;
    cell.textContent = 'No candidates added yet';
  } else {
    app.candidates.forEach(candidate => {
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td>${candidate.id}</td>
        <td>${candidate.name}</td>`;
    });
  }
}




