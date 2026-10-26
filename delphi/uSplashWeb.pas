unit uSplashWeb;

{
  AutoMax — Splash Screen com integração Web
  ------------------------------------------
  Exibe a splash hospedada no Firebase se houver internet.
  Caso contrário, carrega o fallback local em splash/index.html.

  Dependências:
    - Delphi 10.4+ (TEdgeBrowser — paleta Internet)
    - System.Net.HttpClient
    - System.Threading
}

interface

uses
  Winapi.Windows, Winapi.Messages,
  System.SysUtils, System.Classes, System.Threading, System.Net.HttpClient,
  Vcl.Controls, Vcl.Forms, Vcl.ExtCtrls,
  Winapi.WebView2, Vcl.Edge;

const
  URL_ONLINE  = 'https://automax-sistemas.web.app';
  TIMEOUT_MS  = 2000;

type
  TFrmSplash = class(TForm)
    EdgeBrowser: TEdgeBrowser;
    tmrFechar: TTimer;

    procedure FormCreate(Sender: TObject);
    procedure EdgeBrowserWebMessageReceived(Sender: TCustomEdgeBrowser;
      Args: TWebMessageReceivedEventArgs);
    procedure tmrFecharTimer(Sender: TObject);

  private
    procedure TestarConexaoECarregar;
    function  UrlOffline: string;
    procedure CarregarUrl(const AUrl: string);
    procedure TratarMensagem(const Msg: string);
  end;

var
  FrmSplash: TFrmSplash;

implementation

{$R *.dfm}

{ TFrmSplash }

procedure TFrmSplash.FormCreate(Sender: TObject);
begin
  // Configura o evento de mensagens do WebView2
  EdgeBrowser.OnWebMessageReceived := EdgeBrowserWebMessageReceived;

  // Testa internet e carrega a URL correta
  TestarConexaoECarregar;
end;

procedure TFrmSplash.TestarConexaoECarregar;
begin
  TTask.Run(procedure
  var
    Http: THTTPClient;
    Online: Boolean;
  begin
    Online := False;
    Http := THTTPClient.Create;
    try
      Http.ConnectionTimeout := TIMEOUT_MS;
      Http.ResponseTimeout   := TIMEOUT_MS;
      try
        Http.Head(URL_ONLINE);
        Online := True;
      except
        Online := False;
      end;
    finally
      Http.Free;
    end;

    TThread.Synchronize(nil, procedure
    begin
      if Online then
        CarregarUrl(URL_ONLINE)
      else
        CarregarUrl(UrlOffline);
    end);
  end);
end;

function TFrmSplash.UrlOffline: string;
begin
  // Pasta "splash" ao lado do executável
  Result := 'file:///' +
    StringReplace(
      ExtractFilePath(Application.ExeName) + 'splash\index.html',
      '\', '/', [rfReplaceAll]
    );
end;

procedure TFrmSplash.CarregarUrl(const AUrl: string);
begin
  EdgeBrowser.Navigate(AUrl);
end;

procedure TFrmSplash.EdgeBrowserWebMessageReceived(
  Sender: TCustomEdgeBrowser;
  Args: TWebMessageReceivedEventArgs);
var
  Msg: string;
begin
  try
    Msg := Args.TryGetWebMessageAsString;
    TratarMensagem(Msg);
  except
    // ignora mensagens malformadas
  end;
end;

procedure TFrmSplash.TratarMensagem(const Msg: string);
begin
  if Msg = 'ABRIR_CHAMADO' then
  begin
    // Abre formulário de chamado interno
    // TFrmChamado.Create(Application).Show;
  end
  else if Msg = 'SUPORTE_WHATSAPP' then
  begin
    // Já tratado no JS — apenas loga se necessário
  end
  else if Msg = 'SUPORTE_EMAIL' then
  begin
    // Já tratado no JS
  end;
end;

procedure TFrmSplash.tmrFecharTimer(Sender: TObject);
begin
  // Opcional: fecha a splash após N segundos e abre o sistema
  tmrFechar.Enabled := False;
  Close;
  // Application.MainForm.Show;
end;

end.
