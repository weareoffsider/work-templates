import <%=componentName%> from './<%=componentName%>.react.js'
<% if (clientJavascript) { %>
import client from './<%=componentName%>.client.js'
<% } %>

export default <%=componentName%>
export {client}


