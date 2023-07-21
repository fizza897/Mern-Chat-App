import React, { useEffect, useState } from "react";
import User from "../../Images/User.png";
import {io} from "socket.io-client"
const Dashboard = () => {
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const fetchConversations = async() => {
      const res = await fetch(
        `http://localhost:8000/api/conversations/${loggedInUser?.id}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });
      const resData = await res.json();
      setConversations(resData);
    }
    fetchConversations();
  }, []);
  useEffect(() => {
    const fetchUsers = async() => {
      const res = await fetch(
        `http://localhost:8000/api/users/${user?.id}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });
      const resData = await res.json();
      setUsers(resData);
    }
    fetchUsers();
  },[]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user:detail")));
  const [conversations, setConversations] = useState([]);
  const [messages,setMessages]=useState("")
  const [users,setUsers]=useState({})
  const [socket,setSocket]=useState(null)
  const [message, setMessage] = useState({
    conversationId: '', // Make sure you have the correct initial value
    messages: [],
    receiver: {
      receiverId: '' // Make sure you have the correct initial value
    }
  });

  useEffect(() => {
    // Establish socket connection when the component mounts
    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);

    // Clean up the socket connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Emit "addUser" event when the socket is set
    if (socket) {
      socket.emit("addUser", user?.id);

      // Listen for "getUsers" event and log active users
      socket.on("getUsers", users => {
        console.log("activeUsers", users);
      });

      // Listen for "getMessage" event and update the messages state
      socket.on("getMessage", data => {
        setMessage(prev => ({
          ...prev,
          messages: [...prev.message, { user: data.user, messages: data.messages }]
        }));
      });
    }
  }, [socket, user]); // Don't forget to add user to the dependencies array

  const sendMessage = async (e) => {
    // Emit "sendMessage" event with the message data
    socket?.emit('sendMessage', {
      conversationId: message?.conversationId,
      senderId: user?.id,
      messages: message.messages,
      receiverId: message?.receiver?.receiverId,
    });

    // Assuming 'messages' is the variable holding the message content to send
    const res = await fetch(`http://localhost:8000/api/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        conversationId: message?.conversationId,
        senderId: user?.id,
        messages: message.messages,
        receiverId: message?.receiver?.receiverId
      })
    });
    
    // Handle the response from the server if needed
    // const data = await res.json();
    // ...
  };


  const fetchMessages=async(conversationId,receiver)=>{
    const res=await fetch(`http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&& recieverId=${receiver?.receiver?.receiverId}`,{
      method:"GET",
      headers:{
        "Content-Type":"application/json",
      }
    });
    const resData=await res.json()
    console.log("resData",resData)
    setMessage({message:resData,receiver,conversationId})
  }
  return (
    <>
      <div className="w-screen flex">
        <div className="w-[25%] h-screen bg-secondary">
          <div className="flex items-center my-8 mx-14">
            <div className="border border-primary p-[2px] rounded-full">
              <img src={User} width={75} height={75} />
            </div>
            <div className="ml-8">
              <h1 className="text-2xl ">{user?.fullName}</h1>
              <p className="text-lg font-light">My account</p>
            </div>
          </div>
          <hr />
          <div className="mx-14 mt-10">
            <div className="text-primary text-lg">Messages</div>
            <div>
              {
                conversations.length > 0 ? 
                conversations.map(({conversationId,user}) => {
                  return (
                    <div className="flex items-center py-8 border-b border-b-gray-300">
                      <div
                        className="cursor-pointer flex items-center" onClick={()=>fetchMessages(conversationId,user)}>
                        <div>
                          <img src={User} width={40} height={40} />
                        </div>
                        <div className="ml-6">
                          <h3 className="text-lg font-semibold">
                            {user?.fullName}
                          </h3>
                          <p className="text-sm font-light text-gray-600">
                            {user?.emails}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }):
                <div className="text-center text-lg font-semibold mt-24">No Conversations</div>
}
            </div>
          </div>
        </div>
        <div className="w-[50%] h-screen bg-white flex flex-col items-center">
          {
            message?.receiver?.fullName &&
          <div className="w-[75%] bg-secondary h-[80px] my-14 rounded-full flex items-center px-14 py-2">
            <div className="cursor-pointer">
              <img src={User} width={60} height={60} />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{message?.receiver?.fullName}</h3>
              <p className="text-sm font-light text-gray-600">{message?.receiver?.emails}</p>
            </div>
            <div className="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg"
       className="icon icon-tabler icon-tabler-phone-outgoing"
       viewBox="0 0 24 24"
       strokeWidth="1.5"
       stroke="black"
       fill="none"
       strokeLinecap="round"
       strokeLinejoin="round">
    <path stroke="currentColor"
          d="M12 5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2a10 10 0 0 1 2.42 6.42 1.5 1.5 0 0 1-2.8.95A7.978 7.978 0 0 0 12 19a7.978 7.978 0 0 0-6.62-3.63 1.5 1.5 0 0 1-2.8-.95A10 10 0 0 1 8 5zm-1 0a1 1 0 0 1-1-1V1H5.33a1 1 0 0 0-.97.757l-2 8A1 1 0 0 0 3 10h18a1 1 0 0 0 .97-.743l-2-8A1 1 0 0 0 18.67 1H16v3a1 1 0 0 1-1 1h-2z"/>
  </svg>
            </div>
          </div>
          }
          <div className="h-[75%] w-full overflow-scroll shawdow-sm">
            <div className="p-14">
             
          {
           message?.message?.length > 0 ?
            message.message.map(({message,user:{id}={}})=>{
              return(
                <div className={`max-w-[40%] rounded-xl p-4 mb-6 ${id === user?.id ?" bg-primary text-white rounded-tl-xl ml-auto" :' bg-secondary rounded-tl-xl'}`}>{message}
                </div>
              )
            }):<div className="text-center text-lg font-semibold mt-24">No Messages Or No Conversations Selected</div>
          }
            </div>
          </div>
          {
            message?.receiver?.fullName &&
          <div className="p-14 w-full flex items-center">
            <input
              placeholder="Type a message."
              value={messages}
              onChange={(e)=>setMessages(e.target.value)}
              className="w-[75%] p-4 border-0 shawdow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
              inputClassName="p-4 border-0 shawdow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
              />
            <div className={`ml-4 p-4 cursor-pointer bg-light rounded-full ${!message && "pointer-events-none"}`} onClick={()=>sendMessage()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-send"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div className={`ml-4 p-4 cursor-pointer bg-light rounded-full ${!message && "pointer-events-none"}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-plus"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
            </div>
          </div>
              }  
        </div>
        <div className="w-[25%] h-screen bg-light py-16">
          <div className="text-primary text-lg">People</div>
          <div>
              {
                users.length > 0 ? 
                users.map(({conversationId,user}) => {
                  return (
                    <div className="flex items-center py-8 border-b border-b-gray-300">
                      <div
                        className="cursor-pointer flex items-center" onClick={()=>fetchMessages("new",user)}>
                        <div>
                          <img src={User} width={40} height={40} />
                        </div>
                        <div className="ml-6">
                          <h3 className="text-lg font-semibold">
                            {user?.fullName}
                          </h3>
                          <p className="text-sm font-light text-gray-600">
                            {user?.emails}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }):
                <div className="text-center text-lg font-semibold mt-24">No Conversations</div>
}
            </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;