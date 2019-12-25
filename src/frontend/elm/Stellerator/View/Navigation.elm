module Stellerator.View.Navigation exposing (navbar)

import Css exposing (..)
import Css.Global exposing (global, selector)
import Css.Transitions as Tr
import Dos exposing (Color(..))
import FormatNumber exposing (format)
import FormatNumber.Locales exposing (usLocale)
import Html.Styled exposing (..)
import Html.Styled.Attributes as A
import Html.Styled.Events as E
import Stellerator.Model exposing (EmulationState(..), Media(..), Model, Msg(..), Route(..), runningCartridge)
import Stellerator.Routing exposing (serializeRoute)



-- COMMON


navigationLink : List Css.Style -> Model -> Route -> String -> Html msg
navigationLink cssExtra model route label =
    let
        color =
            if model.currentRoute == route then
                Dos.color White

            else
                Dos.color Black
    in
    let
        background =
            if model.currentRoute == route then
                Dos.backgroundColor DarkGray

            else
                backgroundColor inherit
    in
    a
        [ A.href <| serializeRoute route
        , A.css <|
            [ Css.property "padding" "0 var(--cw)"
            , color |> important
            , background |> important
            , textDecoration none |> important
            , display inlineBlock
            ]
                ++ cssExtra
        ]
        [ text label ]


emulationState : Model -> String
emulationState model =
    case model.emulationState of
        EmulationStopped ->
            "stopped"

        EmulationPaused ->
            "paused"

        EmulationRunning Nothing ->
            "running"

        EmulationRunning (Just speed) ->
            "running: " ++ format { usLocale | decimals = 2 } (speed / 1000000) ++ " MHz"

        EmulationError _ ->
            "error"


navbar : Model -> Media -> List (Html Msg)
navbar model media =
    case media of
        MediaWide ->
            navbarWide model

        MediaNarrow ->
            navbarNarrow model


titlebar : String -> String -> String -> List Style -> Html Msg
titlebar delLeft delRight title styles =
    let
        delimiter x =
            div [ A.css <| [ display inlineBlock, whiteSpace noWrap, padding2 (Css.em 0) (Css.em 1), flexShrink (int 0) ] ]
                [ text x ]
    in
    div [ A.css <| [ displayFlex, justifyContent center, overflow hidden ] ++ styles ]
        [ delimiter delLeft
        , div [ A.css [ display inlineBlock, whiteSpace noWrap, overflow hidden, textOverflow ellipsis ] ] [ text title ]
        , delimiter delRight
        ]



-- WIDE


navbarWide : Model -> List (Html Msg)
navbarWide model =
    let
        title =
            runningCartridge model |> Maybe.map (\x -> "Stellerator: " ++ x.name) |> Maybe.withDefault "6502.ts / Stellerator"
    in
    [ div
        [ A.css
            [ Css.width (vw 100)
            , Css.height (Css.em 2)
            , position fixed
            , top (px 0)
            , left (px 0)
            , zIndex (int 20)
            , Dos.color LightGray
            , Dos.backgroundColor Black
            ]
        ]
        [ titlebar "----====≡≡≡≡" "≡≡≡≡====----" title []
        , nav [ A.css [ Dos.backgroundColor LightGray, Dos.color Black ] ]
            [ navigationLink [] model RouteCartridges "Cartridges"
            , navigationLink [] model RouteSettings "Settings"
            , navigationLink [] model RouteEmulation "Emulation"
            , navigationLink [] model RouteHelp "Help"
            , span [ A.css [ float right, property "margin-right" "var(--cw)" ] ] [ text <| emulationState model ]
            ]
        ]
    , global <| [ selector "body" [ paddingTop (Css.em 2) ] ]
    ]



-- NARROW


menuButton : Model -> Html Msg
menuButton model =
    let
        rotateCss =
            if model.sideMenu then
                [ transform <| rotate (deg -90) ]

            else
                []
    in
    div
        [ A.css <|
            [ position absolute
            , top (px 0)
            , left (px 0)
            , Dos.backgroundColor DarkGray
            , height (Css.em 2)
            , Dos.widthCw 4
            , overflow hidden
            ]
        , E.onClick ToggleSideMenu
        ]
        [ div
            [ A.css <|
                [ Dos.color White
                , Tr.transition [ Tr.transform 300 ]
                ]
                    ++ rotateCss
            ]
            [ text "░░░░", br [] [], text "░░░░" ]
        ]


slideoverMenu : Model -> Html Msg
slideoverMenu model =
    let
        linkCss =
            [ paddingTop (Css.em 1)
            , paddingBottom (Css.em 1)
            , textAlign center
            ]
    in
    let
        slideCss =
            if model.sideMenu then
                []

            else
                [ transform <| translateX (pct -100) ]
    in
    div
        [ Dos.panel
        , A.css <|
            [ position fixed
            , left (px 0)
            , top (Css.em 2)
            , width (vw 70)
            , Dos.backgroundColor LightGray
            , Dos.color Black
            , Tr.transition [ Tr.transform 300 ]
            , displayFlex
            , flexDirection column
            ]
                ++ slideCss
        ]
        [ navigationLink linkCss model RouteCartridges "Cartridges"
        , navigationLink linkCss model RouteSettings "Settings"
        , navigationLink linkCss model RouteEmulation "Emulation"
        , navigationLink linkCss model RouteHelp "Help"
        ]


navbarNarrow : Model -> List (Html Msg)
navbarNarrow model =
    let
        title =
            runningCartridge model |> Maybe.map .name |> Maybe.withDefault "Stellerator"
    in
    [ div
        [ A.css
            [ Css.width (vw 100)
            , Css.height (Css.em 2)
            , position fixed
            , top (px 0)
            , left (px 0)
            , zIndex (int 20)
            , Dos.color LightGray
            , Dos.backgroundColor Black
            ]
        ]
        [ titlebar "--==≡≡" "≡≡==--" title [ property "padding-left" "calc(4 * var(--cw))" ]
        , div [ A.css [ Dos.backgroundColor LightGray, Dos.color Black, textAlign right ] ] [ text <| emulationState model ]
        , menuButton model
        , slideoverMenu model
        ]
    , global <| [ selector "body" [ paddingTop (Css.em 2) ] ]
    ]