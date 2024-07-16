"use client";

import { QUESTIONS_ICON_MAP, QUESTIONS_NAME_MAP, getQuestionDefaults } from "@/app/lib/questions";
import { createId } from "@paralleldrive/cuid2";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, EllipsisIcon, TrashIcon } from "lucide-react";
import React, { useState } from "react";
import { TProduct } from "@formbricks/types/product";
import {
  TSurveyEndScreenCard,
  TSurveyQuestion,
  TSurveyQuestionTypeEnum,
  TSurveyRedirectUrlCard,
  ZSurveyQuestion,
} from "@formbricks/types/surveys/types";
import { ConfirmationModal } from "@formbricks/ui/ConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@formbricks/ui/DropdownMenu";

interface EditorCardMenuProps {
  cardIdx: number;
  lastCard: boolean;
  duplicateCard: (cardIdx: number) => void;
  deleteCard: (cardIdx: number) => void;
  moveCard: (cardIdx: number, up: boolean) => void;
  card: TSurveyQuestion | TSurveyEndScreenCard | TSurveyRedirectUrlCard;
  updateCard: (cardIdx: number, updatedAttributes: any) => void;
  addCard: (question: any, index?: number) => void;
  cardType: "question" | "ending";
  product?: TProduct;
}

export const EditorCardMenu = ({
  cardIdx,
  lastCard,
  duplicateCard,
  deleteCard,
  moveCard,
  product,
  card,
  updateCard,
  addCard,
  cardType,
}: EditorCardMenuProps) => {
  const [logicWarningModal, setLogicWarningModal] = useState(false);
  const [changeToType, setChangeToType] = useState(
    card.type !== "endScreen" && card.type !== "redirectToUrl" ? card.type : undefined
  );

  const changeQuestionType = (type?: TSurveyQuestionTypeEnum) => {
    const parseResult = ZSurveyQuestion.safeParse(card);
    if (parseResult.success && type) {
      const question = parseResult.data;
      const { headline, required, subheader, imageUrl, videoUrl, buttonLabel, backButtonLabel } = question;

      const questionDefaults = getQuestionDefaults(type, product);

      // if going from single select to multi select or vice versa, we need to keep the choices as well

      if (
        (type === TSurveyQuestionTypeEnum.MultipleChoiceSingle &&
          question.type === TSurveyQuestionTypeEnum.MultipleChoiceMulti) ||
        (type === TSurveyQuestionTypeEnum.MultipleChoiceMulti &&
          question.type === TSurveyQuestionTypeEnum.MultipleChoiceSingle)
      ) {
        updateCard(cardIdx, {
          choices: question.choices,
          type,
          logic: undefined,
        });

        return;
      }

      updateCard(cardIdx, {
        ...questionDefaults,
        type,
        headline,
        subheader,
        required,
        imageUrl,
        videoUrl,
        buttonLabel,
        backButtonLabel,
        logic: undefined,
      });
    }
  };

  const addQuestionCardBelow = (type: TSurveyQuestionTypeEnum) => {
    const parseResult = ZSurveyQuestion.safeParse(card);
    if (parseResult.success) {
      const question = parseResult.data;
      const questionDefaults = getQuestionDefaults(type, product);

      addCard(
        {
          ...questionDefaults,
          type,
          id: createId(),
          required: true,
        },
        cardIdx + 1
      );

      // scroll to the new question
      const section = document.getElementById(`${question.id}`);
      section?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
    }
  };

  const addEndingCardBelow = () => {
    addCard(cardIdx + 1);
  };

  const onConfirm = () => {
    changeQuestionType(changeToType);
    setLogicWarningModal(false);
  };

  return (
    <div className="flex space-x-2">
      <CopyIcon
        className="h-4 cursor-pointer text-slate-500 hover:text-slate-600"
        onClick={(e) => {
          e.stopPropagation();
          duplicateCard(cardIdx);
        }}
      />
      <TrashIcon
        className="h-4 cursor-pointer text-slate-500 hover:text-slate-600"
        onClick={(e) => {
          e.stopPropagation();
          deleteCard(cardIdx);
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger>
          <EllipsisIcon className="h-4 w-4 text-slate-500 hover:text-slate-600" />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <div className="flex flex-col">
            {cardType === "question" && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="cursor-pointer text-slate-500 hover:text-slate-600">
                    <span className="text-xs text-slate-500">Change question type</span>
                  </div>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent className="ml-4 border border-slate-200">
                  {Object.entries(QUESTIONS_NAME_MAP).map(([type, name]) => {
                    const parsedResult = ZSurveyQuestion.safeParse(card);
                    if (parsedResult.success) {
                      const question = parsedResult.data;
                      if (type === question.type) return null;
                      return (
                        <DropdownMenuItem
                          key={type}
                          className="min-h-8 cursor-pointer text-slate-500"
                          onClick={() => {
                            setChangeToType(type as TSurveyQuestionTypeEnum);
                            if (question.logic) {
                              setLogicWarningModal(true);
                              return;
                            }

                            changeQuestionType(type as TSurveyQuestionTypeEnum);
                          }}>
                          {QUESTIONS_ICON_MAP[type as TSurveyQuestionTypeEnum]}
                          <span className="ml-2">{name}</span>
                        </DropdownMenuItem>
                      );
                    }
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {cardType === "ending" && (
              <DropdownMenuItem
                className="flex min-h-8 cursor-pointer justify-between text-slate-500 hover:text-slate-600"
                onClick={(e) => {
                  e.preventDefault();
                  addEndingCardBelow();
                }}>
                <span className="text-xs text-slate-500">Add Ending Card below</span>
              </DropdownMenuItem>
            )}

            {cardType === "question" && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="cursor-pointer text-slate-500 hover:text-slate-600">
                    <span className="text-xs text-slate-500">Add question below</span>
                  </div>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent className="ml-4 border border-slate-200">
                  {Object.entries(QUESTIONS_NAME_MAP).map(([type, name]) => {
                    if (type === card.type) return null;

                    return (
                      <DropdownMenuItem
                        key={type}
                        className="min-h-8 cursor-pointer text-slate-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cardType === "question") {
                            addQuestionCardBelow(type as TSurveyQuestionTypeEnum);
                          }
                        }}>
                        {QUESTIONS_ICON_MAP[type as TSurveyQuestionTypeEnum]}
                        <span className="ml-2">{name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuItem
              className={`flex min-h-8 cursor-pointer justify-between text-slate-500 hover:text-slate-600 ${
                cardIdx === 0 ? "opacity-50" : ""
              }`}
              onClick={(e) => {
                if (cardIdx !== 0) {
                  e.stopPropagation();
                  moveCard(cardIdx, true);
                }
              }}
              disabled={cardIdx === 0}>
              <span className="text-xs text-slate-500">Move up</span>
              <ArrowUpIcon className="h-4 w-4" />
            </DropdownMenuItem>

            <DropdownMenuItem
              className={`flex min-h-8 cursor-pointer justify-between text-slate-500 hover:text-slate-600 ${
                lastCard ? "opacity-50" : ""
              }`}
              onClick={(e) => {
                if (!lastCard) {
                  e.stopPropagation();
                  moveCard(cardIdx, false);
                }
              }}
              disabled={lastCard}>
              <span className="text-xs text-slate-500">Move down</span>
              <ArrowDownIcon className="h-4 w-4" />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationModal
        open={logicWarningModal}
        setOpen={setLogicWarningModal}
        title="Changing will cause logic errors"
        text="Changing the question type will remove the logic conditions from this question"
        buttonText="Change anyway"
        onConfirm={onConfirm}
        buttonVariant="darkCTA"
      />
    </div>
  );
};
