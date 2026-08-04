import React from 'react';

export const AmazonConnectChat: React.FC = () => (
    <script
        dangerouslySetInnerHTML={{
            __html: `(function(w, d, x, id){     
                    s=d.createElement('script');     
                    s.src='https://d2zasqxhmd6ne4.cloudfront.net/amazon-connect-chat-interface-client.js';     
                    s.async=1;     
                    s.id=id;     
                    d.getElementsByTagName('head')[0].appendChild(s);     
                    w[x] =  w[x] || function(){ 
                        (w[x].ac = w[x].ac || []).push(arguments) 
                    };
            
                })(window, document, 'amazon_connect', '3f976a76-c79e-4810-8086-bb0b3f701714');
            
                amazon_connect('styles', { openChat:
            
                { color: 'white', backgroundColor: '#FF561F'}
                , closeChat: { color: 'white', backgroundColor: '#FF561F'} });
            
                amazon_connect('snippetId', 'QVFJREFIaTl2VUdnV3lybUVtc0FxTFVtYk4vUHoxRGdsUDM2Vm4zaFp0YXlzdS8wUEFIMGNNOXpWKy9wd2VrQndneUIxek9OQUFBQWJqQnNCZ2txaGtpRzl3MEJCd2FnWHpCZEFnRUFNRmdHQ1NxR1NJYjNEUUVIQVRBZUJnbGdoa2dCWlFNRUFTNHdFUVFNMW5iZmVOTXRYQXBzWDJ2VUFnRVFnQ3VwUSttR0V5SDVsSzJjdmNzanRxYmU2RDRpM3hzQVpnUXJzWXhzajdweENhcitFelRBbkhNSXpzWjE6OmhSWVNSZld0L3JpdjZIbjlSejRGRysrNzBQTUlrMTNyeFJkeXRrblh2MTEvV1RkZWFDaDRCMmZ2VDBFR3oxYytBVVQ3T0E3RG53Si9QaXROVkJ1eXJyQXBZUlBrWWw1UmNrRjc0aHUyb29PSTM5K1d1NEo0eTJ1a2JUN3ExK3dPbWMzT25PY1VhbjFXS05ueHdZU24rT0wwU3Q1K09acz0=');
            
                amazon_connect('supportedMessagingContentTypes', [ 'text/plain', 'text/markdown' ]);            
                
                window.onload = function(){
                    let chatButtonToggle = document.querySelector('#amazon-connect-chat-widget button')
                    chatButtonToggle.click();
                    chatButtonToggle.style.display = 'none';
           
                    let chatBoardContainer = document.querySelector('#amazon-connect-chat-widget > div:first-child');
                    chatBoardContainer.style.top = '0';
                    chatBoardContainer.style.bottom = '0';
                    chatBoardContainer.style.left = '0';            
                    chatBoardContainer.style.right = '0';            
            
                    let chatBoard = document.querySelector('#amazon-connect-chat-widget > div:first-child > div:first-child')
                    chatBoard.style.width = '100%';
                    chatBoard.style.height = '100%';

                    let chatHeader = document.querySelector("div.sc-jnlKLf.bnArjw");
                    chatHeader.style.background = 'rgb(255,102,0)';
                    chatHeader.style.borderRadius = '0';
                }`,
        }}
    />
);

export default AmazonConnectChat;
