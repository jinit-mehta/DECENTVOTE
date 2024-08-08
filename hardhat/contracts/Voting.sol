//SPDX_License_Identifier:MIT
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 numberOfVotes;
    }

    Candidate[] public candidates;

    //Owner's Address
    address public owner;

    //Voter's Addresses
    mapping(address => bool) voters;

    //List of voters
    address[] public listOfVoters;

    //Voting Session
    uint256 public votingStart;
    uint256 public votingStop;

    bool public electionStarted;

    //modifier

    modifier onlyOwner() {
        require(msg.sender == owner, "Not Authorized");
        _;
    }

    //Ongoing Election
    modifier electionOngoing() {
        require(electionStarted, "No election yet");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function startElection(
        string[] memory _candidates,
        uint256 _votingDuration
    ) public onlyOwner {
        require(electionStarted == false, "There is an ongoing election");
        delete candidates;
        resetAllVotersStatus();

        for (uint256 i = 0; i < _candidates.length; i++) {
            candidates.push(
                Candidate({id: i, name: _candidates[i], numberOfVotes: 0})
            );
        }
        electionStarted = true;
        votingStart = block.timestamp;
        votingStop = block.timestamp + (_votingDuration * 1 minutes);
    }

    //Add Candidate
    function addCandidate(
        string memory _name
    ) public onlyOwner electionOngoing {
        require(checkElectionPeriod(),"Election Period Ended");
        candidates.push(
            Candidate({id: candidates.length, name: _name, numberOfVotes: 0})
        );
    }

    function voterStatus(
        address _voter
    ) public view electionOngoing returns (bool) {
        if (voters[_voter] == true) {
            return true;
        }
        return false;
    }

    function voteTo(uint256 _id) public electionOngoing {
        require(checkElectionPeriod(), "Election period ended");
        require(!voterStatus(msg.sender), "Can vote only once.");
        candidates[_id].numberOfVotes++;
        voters[msg.sender] = true;
        listOfVoters.push(msg.sender);
    }

    //Number of votes
    function getVotes() public view returns (Candidate[] memory) {
        return candidates;
    }

    function electionTimer() public view electionOngoing returns (uint256) {
        if(block.timestamp >= votingStop){
            return 0;
        }
        return (votingStop - block.timestamp); 
    }

    //Election ONgoing 
    function checkElectionPeriod() public returns(bool){
        if(electionTimer() > 0){
            return true;
        }
        electionStarted = false;
        return false;
    }

    //Reset Voters

    function resetAllVotersStatus() public onlyOwner{
        for(uint256 i = 0; i < listOfVoters.length; i++){
            voters[listOfVoters[i]] = false;
        }
        delete listOfVoters;
    }

     // New function to end the election
    function endElection() public onlyOwner {
        require(electionStarted, "No ongoing election");
        electionStarted = false;
        votingStop = block.timestamp;
    }

    // New function to get election status
    function getElectionStatus() public view returns (bool, uint256) {
        return (electionStarted, electionTimer());
    }
}