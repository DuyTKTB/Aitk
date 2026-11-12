fetch('https://duyheheh-2a269-default-rtdb.firebaseio.com/chat/messages.json?orderBy=%22$key%22&limitToLast=10')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(console.error);
