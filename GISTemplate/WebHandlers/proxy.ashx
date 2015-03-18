<%@ WebHandler Language="VB" Class="proxy" %>

Imports System
Imports System.Web
Imports System.Net
Imports System.IO
Imports System.Xml.Serialization

Public Class proxy : Implements IHttpHandler
    Sub ProcessRequest(ByVal context As HttpContext) Implements IHttpHandler.ProcessRequest
        Dim response As HttpResponse = context.Response
        Dim uri As String = context.Request.Url.Query.Substring(1)
        Dim strResponse As String = ""
        Dim req As System.Net.HttpWebRequest = CType(System.Net.HttpWebRequest.Create(uri), System.Net.HttpWebRequest)
        Dim serverResponse As System.Net.WebResponse = Nothing
        
        req.Method = context.Request.HttpMethod
        req.Credentials = CredentialCache.DefaultCredentials
        req.ServicePoint.Expect100Continue = False
        req.Timeout = 180000
		
        ' Set body of request for POST requests
        If context.Request.InputStream.Length > 0 Then
            Dim bytes As Byte() = New Byte(context.Request.InputStream.Length - 1) {}
            context.Request.InputStream.Read(bytes, 0, CInt(context.Request.InputStream.Length))
            req.ContentLength = bytes.Length

            Dim [ctype] As String = context.Request.ContentType
            If [String].IsNullOrEmpty([ctype]) Then
                req.ContentType = "application/x-www-form-urlencoded"
            Else
                req.ContentType = [ctype]
            End If

            Using outputStream As Stream = req.GetRequestStream()
                outputStream.Write(bytes, 0, bytes.Length)
            End Using
        End If
        
        Try
            serverResponse = req.GetResponse()
        Catch webExc As System.Net.WebException
            'cIssue.ReportIssue("WebHandlers/proxy-ProcessRequest", "Error: " & webExc.Status.ToString(), HttpContext.Current.User.Identity.Name)
            response.StatusCode = 500
            response.StatusDescription = webExc.Status.ToString()
            response.Write(webExc.Response)
            response.[End]()
            Return
        End Try

        ' Set up the response to the client
        If serverResponse IsNot Nothing Then
            response.ContentType = serverResponse.ContentType
            
            Using byteStream As Stream = serverResponse.GetResponseStream()
                ' Text response
                If serverResponse.ContentType.Contains("text") OrElse serverResponse.ContentType.Contains("json") Then
                    Using sr As New StreamReader(byteStream)
                        strResponse = sr.ReadToEnd()
                        response.Write(strResponse)
                        'sr.Close()
                    End Using
                Else
                    ' Binary response (image, lyr file, other binary file)
                    Dim br As New BinaryReader(byteStream)
                    Dim outb As Byte() = br.ReadBytes(CInt(serverResponse.ContentLength))
                    br.Close()

                    ' Tell client not to cache the image since it's dynamic
                    response.CacheControl = "no-cache"

                    ' Send the image to the client
                    ' (Note: if large images/files sent, could modify this to send in chunks)
                    response.OutputStream.Write(outb, 0, outb.Length)
                End If
                
                serverResponse.Close() ' Write out the response back to the client

                'response.Write(strResponse)	
                'serverResponse.Close()
            End Using
        End If
        
        response.[End]()
    End Sub

    Private Function CleanStrings(ByVal str As String) As String
        Return HttpUtility.HtmlAttributeEncode(str)
    End Function

    ReadOnly Property IsReusable() As Boolean Implements IHttpHandler.IsReusable
        Get
            Return False
        End Get
    End Property
    
    ' Gets the token for a server URL from a configuration file
    ' TODO: ?modify so can generate a new short-lived token from username/password in the config file
    Private Function getTokenFromConfigFile(uri As String) As String
        Try
            Dim config As ProxyConfig = ProxyConfig.GetCurrentConfig()
            If config IsNot Nothing Then
                Return config.GetToken(uri)
            Else
                Throw New ApplicationException("Proxy.config file does not exist at application root, or is not readable.")
            End If
        Catch generatedExceptionName As InvalidOperationException
            ' Proxy is being used for an unsupported service (proxy.config has mustMatch="true")
            Dim response As HttpResponse = HttpContext.Current.Response
            response.StatusCode = CInt(System.Net.HttpStatusCode.Forbidden)
            response.[End]()
        Catch e As Exception
            If TypeOf e Is ApplicationException Then
                Throw e

                ' just return an empty string at this point
                ' -- may want to throw an exception, or add to a log file
            End If
        End Try

        Return String.Empty
    End Function
End Class

<XmlRoot("ProxyConfig")> _
Public Class ProxyConfig
#Region "Static Members"

    Private Shared _lockobject As New Object()

    Public Shared Function LoadProxyConfig(fileName As String) As ProxyConfig
        Dim config As ProxyConfig = Nothing

        SyncLock _lockobject
            If System.IO.File.Exists(fileName) Then
                Dim reader As New XmlSerializer(GetType(ProxyConfig))
                Using file As New System.IO.StreamReader(fileName)
                    config = DirectCast(reader.Deserialize(file), ProxyConfig)
                End Using
            End If
        End SyncLock

        Return config
    End Function

    Public Shared Function GetCurrentConfig() As ProxyConfig
        Dim config As ProxyConfig = TryCast(HttpRuntime.Cache("proxyConfig"), ProxyConfig)
        If config Is Nothing Then
            Dim fileName As String = GetFilename(HttpContext.Current)
            config = LoadProxyConfig(fileName)

            If config IsNot Nothing Then
                Dim dep As New CacheDependency(fileName)
                HttpRuntime.Cache.Insert("proxyConfig", config, dep)
            End If
        End If

        Return config
    End Function

    Public Shared Function GetFilename(context As HttpContext) As String
        Return context.Server.MapPath("~/proxy.config")
    End Function
#End Region

    Private m_serverUrls As ServerUrl()
    Private m_mustMatch As Boolean

    <XmlArray("serverUrls")> _
    <XmlArrayItem("serverUrl")> _
    Public Property ServerUrls() As ServerUrl()
        Get
            Return Me.m_serverUrls
        End Get
        Set(value As ServerUrl())
            Me.m_serverUrls = value
        End Set
    End Property

    <XmlAttribute("mustMatch")> _
    Public Property MustMatch() As Boolean
        Get
            Return m_mustMatch
        End Get
        Set(value As Boolean)
            m_mustMatch = value
        End Set
    End Property

    Public Function GetToken(uri As String) As String
        For Each su As ServerUrl In m_serverUrls
            If su.MatchAll AndAlso uri.StartsWith(su.Url, StringComparison.InvariantCultureIgnoreCase) Then
                Return su.Token
            Else
                If [String].Compare(uri, su.Url, StringComparison.InvariantCultureIgnoreCase) = 0 Then
                    Return su.Token
                End If
            End If
        Next

        If m_mustMatch Then
            Throw New InvalidOperationException()
        End If

        Return String.Empty
    End Function
End Class

Public Class ServerUrl
    Private m_url As String
    Private m_matchAll As Boolean
    Private m_token As String

    <XmlAttribute("url")> _
    Public Property Url() As String
        Get
            Return m_url
        End Get
        Set(value As String)
            m_url = value
        End Set
    End Property

    <XmlAttribute("matchAll")> _
    Public Property MatchAll() As Boolean
        Get
            Return m_matchAll
        End Get
        Set(value As Boolean)
            m_matchAll = value
        End Set
    End Property

    <XmlAttribute("token")> _
    Public Property Token() As String
        Get
            Return m_token
        End Get
        Set(value As String)
            m_token = value
        End Set
    End Property
End Class